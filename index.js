const Engine = require('./engine');
const config = require('./config');
const wsConnector = require('./wsConnector');

//main app
module.exports = (address, credentials, _config) => {
    if (_config)
        Object.assign(config, _config);

    const engine = new Engine();

    //add some other vars
    engine.config = config;

    if (config.debugLevel !== 'none')
        require('./debug')(engine);
    wsConnector(engine, address, credentials);

    return engine;
};