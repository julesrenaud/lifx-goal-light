triggerLights = (color, label, logger) => {
  const Lifx = require('node-lifx-lan');
  const Config = require('../config.json');
  var timeExpired = false;

  setTimeout(() => {
    timeExpired = true
  }, Config.delay);

  Lifx.discover().then((res) => {
    var lights = [];
    var devices = res;

    devices.forEach(function(dev) {
      if (label && dev.deviceInfo.label === label) {
        lights.push(dev.lightGet());
      } else if (!label) {
        lights.push(dev.lightGet());
      }
    });

    Promise.all(lights).then((lights) => {
      if (!lights.length) return;

      logger.info(`Lights triggered with color ${color} and brightness ${Config.brightness}`);

      lights.forEach((light, i) => {
        if (light.power) {

          var countdown = setInterval(() => {
            if (!timeExpired) return;

            devices[i].setColor({
              color: {
                css: color,
                brightness: Config.brightness
              },
              duration: 100

            }).then(() => {
              setTimeout(() => {
                devices[i].setColor({
                  color: light.color,
                  brightness: light.brightness,
                  duration: 100
                });
              }, Config.duration);

            }).catch((error) => {
              logger.error(error);
            });

            clearInterval(countdown);
          }, 100);

        } else {
          var countdown = setInterval(() => {
            if (!timeExpired) return;

            devices[i].turnOn({
              color: {
                css: color,
                brightness: Config.brightness
              },
            }).then(() => {
              setTimeout(() => {
                devices[i].turnOff({
                  duration: 0
                });

                devices[i].setColor({
                  color: light.color,
                  brightness: light.brightness,
                  duration: 100
                });
              }, Config.duration);

            }).catch((error) => {
              logger.error(error);
            });

            clearInterval(countdown);
          }, 100);
        }
      });
    });
  });
};

module.exports = {
  triggerLights: triggerLights
};