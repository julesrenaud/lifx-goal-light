# LIFX Goal Light

A Node.js app that polls NHL stats API (no official documentation available) data for a team's game events and controls LIFX light bulbs via the [LIFX LAN Protocol](https://lan.developer.lifx.com/).

## Usage

Just run the main script (./index.js) `node index.js` or `npm start`. Idealy use a process manager (such as PM2) on a Raspberry Pi or a dedicated computer.

## Under the hood

The app polls the NHL stats API to find games in which the defined team features. You can change the team and other options by accessing the configuration webapp accessible on port 1967 (`http://DEVICENAME.local:1967`). When a game is ongoing, the app polls the NHL stats API every 10 seconds and triggers the LIFX light bulbs with color red after your team scores and color green when a the app starts listening to game events and when a period or intermisson ends. Delays between TV broadcast and the lights are to be expected. Game events and their metadata are submitted by NHL staff and it appears some of them work faster than others. ¯\_(ツ)_/¯
