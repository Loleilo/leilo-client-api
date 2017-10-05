const WebSocket = require('ws');
const config = require('./config');
const isValidLogin = require("./user.js").isValidLogin;
const serverID = config.serverID;
const Sandbox = require('./sandbox').Sandbox;
const JSON = require('circular-json');
require('colors');

let globalConnectionID = 0;

//handles a client websocket connection
module.exports = (engine) => {
    engine.on(['serverInit', serverID, serverID], () => {
        const state = engine.state;
        state.sandboxes = {};
        const wss = new WebSocket.Server({port: 80});
        wss.on('connection', (ws) => {
            globalConnectionID++;
            const currConnectionID = "connection#" + globalConnectionID;
            ws.send(`tryAuth ${config.version}`);

            //auto disconnects on implicit disconnect (socket closed without warning)
            const autoDisconnectAddListener = (emitter, evt, listener, id, once = false) => {
                //wrapper emits client_disconnected when listener is called and ws is not open
                const listenerWrapped = (...args) => {
                    if (ws.readyState !== WebSocket.OPEN) {
                        if (ws.disconnectEmitted)return;
                        ws.disconnectEmitted = true;
                        engine.emit(['clientDisconnected', id, serverID]);
                    } else listener(...args);
                };

                //todo make this less custy
                let func = emitter.on.bind(emitter);
                if (once) func = emitter.once.bind(emitter);

                let actualFunc = func(evt, listenerWrapped);
                if (typeof(actualFunc) !== 'function') actualFunc = listenerWrapped;

                //handler removes the listener
                engine.once(['clientDisconnected', id, serverID],
                    () => emitter.removeListener(evt, actualFunc));
            };

            //display disconnected message
            engine.once(['clientDisconnected', currConnectionID, currConnectionID], () => {
                console.log(`Client @${currConnectionID} disconnected`);
            });

            const messageHandler = (data) => {
                let msg;
                try {
                    msg = JSON.parse(data);
                } catch (err) {
                    engine.emit(['error', currConnectionID, serverID], {
                        err: new Error("Couldn't parse JSON")
                    });
                }

                if (msg !== undefined && isValidLogin(engine.state, msg)) {
                    ws.send(`authSuccessful`); //send indicator

                    //store current client username
                    const currClientID = msg.username;
                    console.log(`User @${currClientID} authenticated`);

                    //create sandbox for client
                    let clientSandbox;
                    if (state.sandboxes[currClientID] === undefined) {
                        clientSandbox = new Sandbox(engine, currClientID);
                        state.sandboxes[currClientID] = clientSandbox;
                        //cleanup
                        engine.emitNext(['gc', serverID, serverID, config.pathMarker, 'sandboxes', currClientID],
                            [['serverExit', serverID, serverID],
                                ['userDeleted', serverID, currClientID],]);
                    } else clientSandbox = state.sandboxes[currClientID];

                    //pipe client messages to server
                    autoDisconnectAddListener(ws, 'message', (message) => {
                        try {
                            const msg = JSON.parse(message);
                            clientSandbox.interface.emit(msg.evt, msg.payload);
                        } catch (err) {
                            engine.emit(['error', currClientID, currClientID], {
                                err: err.toString()
                            });
                        }
                    }, currConnectionID);

                    //handles when server sends messages to client
                    const serverEvtHandler = (payload, evt) => {
                        //todo if (evt.src === currClientID)return; //prevents getting self messages
                        const msg = JSON.stringify({
                            evt: evt,
                            payload: payload,
                        });
                        ws.send(msg);
                    };
                    autoDisconnectAddListener(clientSandbox.interface, {
                        name: '*',
                        src: '*',
                    }, serverEvtHandler, currConnectionID);
                    autoDisconnectAddListener(clientSandbox.interface, {
                        name: '*',
                        src: '*',
                        path: ['**'],
                    }, serverEvtHandler, currConnectionID);

                    //send client connected event
                    engine.emit(['clientConnected', serverID, serverID], undefined, currClientID);
                } else {
                    ws.send(`authRejected`);
                    ws.close();
                }
            };

            autoDisconnectAddListener(ws, 'message', messageHandler, currConnectionID, true);
        });
    })
};