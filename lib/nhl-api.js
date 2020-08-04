const fs = require('fs')
const path = require('path')
const ms = require('ms');
const moment = require('moment');
const Duration = require('duration');
const NhlStats = require('statsapi-nhl');
const fetch = require('statsapi-nhl/src/utils/fetch');
const Lifx = require('./lifx');
const logger = require('./logger');
const configPath = path.join(__dirname, '../config.json');

const getLinescore = (id) => {
  const url = `https://statsapi.web.nhl.com/api/v1/game/${id}/linescore`
  return new Promise((resolve, reject) => {
    fetch(url).then((res) => {
      resolve(res)
    }).catch((err) => {
      reject(err)
    });
  });
}

const getGameEvents = (id, subtractAmount) => {
  const timecode = moment().subtract(subtractAmount, 'ms').utc().format('YYYYMMDD_HHmmss');
  const url = `https://statsapi.web.nhl.com/api/v1/game/${id}/feed/live/diffPatch?startTimecode=${timecode}`;
  return new Promise((resolve, reject) => {
    fetch(url).then((res) => {
      resolve(res);
    }).catch((err) => {
      reject(err);
    });
  });
}

const findGameToWatch = () => {
  fs.exists(configPath, (exists) => {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const label = config.hasOwnProperty('label') ? config.label : null;
    const teamName = config.teamName;
    let teamIsHome;

    // assume there are no games in schedule (known issue with statsapi-nhl lib)
    NhlStats.Game.getTodayGames().catch((error) => {
      logger.info('No games in current schedule, checking again in 1 hour');
      return setTimeout(findGameToWatch, ms('1h'));
    });

    NhlStats.Game.getTodayGames().then((games) => {

      var gamesFiltered = games.filter((item) => {
        if (item.h === teamName) {
          teamIsHome = true;
        } else if (item.a === teamName) {
          teamIsHome = false;
        }

        return item.a === teamName || item.h === teamName;
      });

      if (!gamesFiltered.length) {
        logger.info('Team does not appear in current schedule, checking again in 1 hour');
        return setTimeout(findGameToWatch, ms('1h'));
      }

      var gameToWatch = gamesFiltered[0];
      var now = new Date();
      var waitTime = new Duration(new Date(now), new Date(gameToWatch.est));
      var waitTimeHour = waitTime.hour;
      var waitTimeMinute = waitTime.minute;
      var waitTimeMs = waitTime.milliseconds;

      // Wait until scheduled time
      if (waitTimeMs > 0) {
        logger.info(`Game ${gameToWatch.id} scheduled to start in ` +
                    `${waitTimeHour} ${(waitTimeHour === 1) ? 'hour' : 'hours' } ` +
                    `${waitTimeMinute} ${(waitTimeMinute > 1) ? 'minutes' : 'minute' }, ` +
                    'waiting for game to start');

        return setTimeout(findGameToWatch, waitTimeMs);
      }

      NhlStats.Game.get(gameToWatch.id).then((game) => {
        const refreshRate = config.hasOwnProperty('refreshRate') ? config.refreshRate : ms(game.metaData.wait + 's');
        const teamToWatchGameData = teamIsHome ? game.liveData.linescore.teams.home : game.liveData.linescore.teams.away;
        const gameStatus = game.gameData.status.detailedState;
        const gameEndedMessage = `Game ${gameToWatch.id} ended, checking again for a scheduled game in 3 hours`;
        let oldScore = teamToWatchGameData.goals;
        let score = teamToWatchGameData.goals;
        let periodEnded = false;
        let zeroLengthStreak = 0;

        if (gameStatus === 'Final') {
          logger.info(gameEndedMessage);
          return setTimeout(findGameToWatch, ms('3h'));
        }

        logger.info(`listening to game ${gameToWatch.id} events...`);
        Lifx.triggerLights('green', label, logger);

        gameLiveFeed = setInterval(() => {
          getGameEvents(gameToWatch.id, refreshRate).then((diffPatch) => {

            if (!diffPatch.length) {
              zeroLengthStreak++;
            } else {
              zeroLengthStreak = 0;
            }

            // Restart script if it receives no events for 30 minutes (180 * 10s = 30m)
            if (zeroLengthStreak >= 180) {

              // Just save config file with current data to trigger script restart ¯\_(ツ)_/¯
              fs.exists(configPath, (exists) => {
                fs.readFile(configPath, (err, data) => {
                  if (err) {
                    logger.error(err);

                  } else {
                    fs.writeFile(configPath, data, (err) => {
                      if (err) throw err;
                    });
                  }
                });
              });
            }

            if (Array.isArray(diffPatch) && diffPatch.length) {
              diffPatch.forEach((obj) => {
                obj.diff.forEach((event) => {

                  if (typeof event.value === 'object' && event.value.hasOwnProperty('about')) {
                    score = teamIsHome ? event.value.about.goals.home : event.value.about.goals.away;
                    period = event.value.about.period;
                    timeRemaining = event.value.about.periodTimeRemaining;
                    timeRemainingSeconds = timeRemaining.split(':').reduce((acc,time) => (60 * acc) + +time);
                    timeExpired = timeRemaining === '00:00';

                    logger.info(`Time remaining: ${timeRemaining} - ${teamName} score: ${score}`);

                    // Check if watched team scored
                    if (score > oldScore) {
                      logger.info(`${teamName} scored`);
                      Lifx.triggerLights('red', label, logger);
                      oldScore = score;
                    }

                    // Check if clock expired
                    if (timeExpired && !periodEnded) {
                      logger.info('Time expired');
                      Lifx.triggerLights('green', label, logger);
                      periodEnded = true;

                      // Wait 5 minutes, then check for intermission time remaining
                      setTimeout(() => {
                        getLinescore(gameToWatch.id).then((linescore) => {
                          const intermission = linescore.intermissionInfo;
                          const intermissionTimeRemaining = intermission.intermissionTimeRemaining;
                          const intermissionTimeRemainingMin = Math.round(intermissionTimeRemaining / 60);
                          const intermissionTimeRemainingMs = ms(intermissionTimeRemaining + 's') - ms('3m');

                          // If intermission time remaining, trigger lights at end of countdown
                          if (intermission.inIntermission && intermissionTimeRemainingMin > 0) {
                            logger.info(`Intermission in progress, ${intermissionTimeRemainingMin} minutes left`)

                            setTimeout(() => {
                              logger.info('3 minutes left before period start');
                              Lifx.triggerLights('green', label, logger);
                            }, intermissionTimeRemainingMs);
                          }
                        });
                      }, ms('5m'));

                    } else if (!timeExpired) {
                      periodEnded = false;
                    }
                  }
                });
              });
            }
          });
        }, refreshRate);
      });
    });
  });
}

module.exports = {
  getLinescore: getLinescore,
  getGameEvents: getGameEvents,
  findGameToWatch: findGameToWatch
}