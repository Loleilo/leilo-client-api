//main app

const load = require('./_leilo-client-api/loader');

module.exports = (config) => {
    const loaded = load(config);
    const engine = loaded.engine;

    engine.config = loaded.globalConfig;

    return engine;
};