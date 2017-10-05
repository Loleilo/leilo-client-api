const Engine = require('./engine');
const config = require('./config');

const obj = require('./obj');
const wsConnector = require('./wsConnector');
const debug = require('./debug');

const serverID = config.serverID;

//main app
module.exports = (address, credentials) => {
    const engine = new Engine();

    obj(engine);
    debug(engine);
    wsConnector(engine, address, credentials);

    return engine;
};