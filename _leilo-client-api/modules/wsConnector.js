const sioc = require('socket.io-client');
const JSON = require('circular-json');
const toArr = require("leilo-backend/pathed").toArr;
const semver = require('semver');
const consts = require('../../consts');
const localID = consts.localID;
const serverID = consts.serverID;

module.exports = (engine, config) => {
    const ws = sioc(config.address);

    ws.once('connect', () => {
        //wait for init, to begin allowing messages from client
        engine.onceM({name: 'init', src: serverID, dst: localID}, (state, next, payload) => {
            const connectionID = payload.connID;
            if (!semver.satisfies(payload.version, consts.serverVersionRequirements)) {
                engine.emit(['error', localID, localID], {
                    err: new Error('Server-client serverVersionRequirements mismatch')
                });
                return;
            }

            const handler = (payload, evt, callback) => {
                if (evt.dst === localID) return;
                if (evt.src === localID)
                    evt.src = connectionID;
                ws.emit('message', JSON.stringify({
                    evt: evt,
                    payload: payload,
                }), callback);
            };

            //pipe messages from client to server
            engine.on(['*', '*', '*', consts.pathMarker, '**'], handler);
            engine.on(['*', '*', '*'], handler);

            engine.on(['forceDisconnect', localID, localID], () => {
                ws.disconnect();
            });

            next(state);
        });

        //wait for messages from server and pipe to client
        ws.on('message', (e) => {
            const msg = JSON.parse(e);
            const tmpEvt = Object.assign({}, msg.evt, {
                dst: localID,
            });
            engine.emit(toArr(tmpEvt), msg.payload, msg.evt);
        });

        ws.once('disconnect', () => engine.emit({
            name: 'disconnect',
            src: localID,
            dst: localID,
        }));
    });
};