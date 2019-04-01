const path = require('path')
const Server = require('./lib/server');
const nodemon = require('nodemon');

nodemon({ script: path.join(__dirname, '/lib/listen.js') }).on('restart', () => {
  console.log('Script restarted');
}).on('crash', () => {
  console.log('Script crashed, restarting');
  nodemon.emit('restart');
});