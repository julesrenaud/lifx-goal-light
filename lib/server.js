const fs = require('fs');
const path = require('path');
const Express = require('express');
const App = Express();
const bodyParser = require('body-parser');
const session = require('express-session');
const fetch = require('statsapi-nhl/src/utils/fetch');
const package = require('../package.json');
const configPath = path.join(__dirname, '../config.json');
const port = 1967;

App.listen(port, () => console.log(`Goal light server listening on port ${port}`));
App.use(bodyParser.urlencoded({ extended: true }));
App.use(session({ secret: '/NT4bzNYd7ew$', cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true }))
App.set('views', path.join(__dirname, 'views'));
App.use('/bootstrap', Express.static(path.join(__dirname, '../node_modules/bootstrap/dist')));
App.use('/', Express.static(path.join(__dirname, '../static')));
App.use('/jquery', Express.static(path.join(__dirname, '../node_modules/jquery/dist')));
App.set('view engine', 'pug');

App.get('/', (req, res) => {

  // Get all active NHL teams
  const url = `https://statsapi.web.nhl.com/api/v1/teams`;

  fetch(url).then((res2) => {
    const teams = res2.teams;
    const showSavedBanner = req.session.hasOwnProperty('saved') && req.session.saved;
    req.session.saved = false;

    fs.exists(configPath, (exists) => {
      res.render('form', {
        title: 'Goal Light',
        showSavedBanner: showSavedBanner,
        nhlLogosBaseUrl: 'https://www-league.nhlstatic.com/images/logos/teams-current-primary-light/',
        config: JSON.parse(fs.readFileSync(configPath, 'utf8')),

        // Sort teams by name
        teams: teams.sort((a,b) => {
          if (a.name < b.name)
            return -1;
          if (a.name > b.name)
            return 1;
          return 0;
        })
      });
    });
  });
});

App.post('/', (req, res) => {
  req.session.saved = true;
 
  for (var key in req.body) {
    if( req.body.hasOwnProperty(key)){
      if (!isNaN(req.body[key])) {
        req.body[key] = req.body[key] * 1;
      }
    }
  }

  fs.exists(configPath, (exists) => {
    fs.readFile(configPath, (err, data) => {
      if (err) {
        console.error(err);

      } else {
        var json = JSON.stringify(req.body);

        fs.writeFile(configPath, json, (err) => {
          if (err) throw err;

          console.log('Options saved from web server');
          res.redirect('/');
        });
      }
    });
  });
});

App.get('/offline', (req, res) => {
  res.render('offline');
});