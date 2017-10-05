const Engine = require('./engine');
const config = require('./config');

const obj = require('./obj');
const wsConnector = require('./wsConnector');

//main app
module.exports = (address, credentials, _config) => {
    if(_config)
        Object.assign(config, _config);

    const engine = new Engine();

    obj(engine);
    if (config.debugLevel !== 'none')
        require('./debug')(engine);
    wsConnector(engine, address, credentials);

    return engine;
};