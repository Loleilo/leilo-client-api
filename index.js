//main app

const load = require('./loader');

module.exports = (config) => {
    const loaded = load(config);
    const engine = loaded.engine;

    engine.config = loaded.globalConfig;

    return engine;
};