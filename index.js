const path = require('path')
const Server = require('./lib/server');
const nodemon = require('nodemon');

nodemon({ script: path.join(__dirname, '/lib/listen.js') }).on('restart', () => {
  // Script restarted
}).on('crash', () => {
  // Script crashed, restarting
  nodemon.emit('restart');
});