const config = require('./config');
const resolve = require('object-path');
const serverID = config.serverID;

module.exports = (engine) => {
    engine.on(['create', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        resolve.set(engine.state, evt.path.concat([payload.newObjName]), payload.newObjVal);
    });

    engine.on(['update', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        resolve.set(engine.state, evt.path, payload.value);
    });

    engine.on(['delete', '*', serverID, config.pathMarker, '**'], (payload, evt) => {
        resolve.del(engine.state, payload.path);
    });
};