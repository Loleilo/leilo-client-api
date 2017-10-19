const JSON = require('circular-json');
const pathMarker = require("../../consts").pathMarker;
// require('longjohn');
// require('colors');
module.exports = (engine, config) => {
    const debugLevel = config.debugLevel;
    const debugHandler = (state, next, payload, evt) => {
        if (debugLevel === 'short') {
            console.log(("Event occurred:" + evt.name
                + '\n' + ' direction: ' + evt.src + '->' + evt.dst
                + '\n' + ' path: ' + evt.path)
            );
        } else if (debugLevel === 'normal') {
            console.log(("Event occurred:" + evt.name
                + '\n' + ' direction: ' + evt.src + '->' + evt.dst
                + '\n' + ' path: ' + evt.path
                + '\n' + ' payload:' + JSON.stringify(payload))
            );
        } else if (debugLevel === 'verbose') {
            console.log(("Event occurred:" + evt.name
                + '\n' + ' direction: ' + evt.src + '->' + evt.dst
                + '\n' + ' path: ' + evt.path
                + '\n' + ' payload:' + JSON.stringify(payload)
                + '\n' + ' state:' + JSON.stringify(state))
            );
        }
        if (evt.name === 'error' || evt.name === 'warning')
            console.log(payload.err.message + " Stack trace:\n" + payload.err.stack);
        next(state);
    };
    engine.onM(['*', '*', '*'], debugHandler);
    engine.onM(['*', '*', '*', pathMarker, '**'], debugHandler);
};