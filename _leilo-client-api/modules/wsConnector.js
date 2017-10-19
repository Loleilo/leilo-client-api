const sioc = require('socket.io-client');
const JSON = require('circular-json');
const toArr = require("leilo-backend/pathed").toArr;
const semver = require('semver');
const consts = require('../../consts');
const localID = consts.localID;

module.exports = (engine, config) => {
    const ws = sioc(config.address);

    ws.on('connect', () => {
        //wait for tryAuth
        ws.once('message', (e) => {
            //todo fix hardcode cust
            const dat = e.split(' ');
            if (!semver.satisfies(dat[1], config.serverVersionRequirements))
                engine.emit(['error', localID, localID], {
                    err: new Error('Server-client serverVersionRequirements mismatch')
                });

            //send credentials
            ws.emit('message', JSON.stringify(config.credentials));

            //wait for auth reject or success
            ws.once('message', (msg) => {
                if (msg === 'authSuccessful') {
                    engine.emitNext(['connectSuccess', localID, localID], {
                        username: config.credentials.username,
                    });

                    //wait for messages from server and pipe to client
                    ws.on('message', (e) => {
                        const msg = JSON.parse(e);
                        const tmpEvt = Object.assign({}, msg.evt, {
                            dst: localID,
                        });
                        engine.emit(toArr(tmpEvt), msg.payload, msg.evt);
                    });

                    const handler = (payload, evt, callback) => {
                        if (evt.dst === localID)return;
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

                    ws.once('disconnect', () => engine.emit({
                        name: 'disconnect',
                        src: localID,
                        dst: localID,
                    }));
                } else {
                    engine.emit(['error', localID, localID], {
                        err: new Error('Failed to connect to server'),
                        res: msg,
                    });

                    engine.emit(['forceDisconnect', localID, localID]);
                    engine.emit(['disconnect', localID, localID]);
                }
            });
        });
    });
};