const perms = require('obj-perms-engine').NVEOPerms;

module.exports = {

    //client-server shared constants

    sharedConsts: {
        serverID: "leilo", //username of server

        pathMarker: 'path',//indicator of path in event array

        permsEngineOptions: {
            USER_LEVEL: {
                ROOT: 0,
                USER: 1,
                PRGM: 2,
            },
            WILDCARD: '*',
            permsModule: perms,
        },
    },

    localConsts:{
        localID: "local", //username used for internal events in client
    },

    //client config

    localConfig: {
        enable: "ALWAYS", //enable all modules by default

        serverVersionRequirements: ">=1.0.2", //server serverVersionRequirements match

        engine: {
            initState: {},
            wildcard: true, //enable wildcards in event name
            maxListeners: 30,
            defaultEvt: [undefined, '*', "local"], //todo replace with non const
            emitDefaultEvt: [undefined, "local", "leilo"],
        },
    },

    //module configs

    moduleOrder: [
        "wsConnector",
        "debug",
    ],

    modules: {
        wsConnector: {
            __moduleName: "wsConnector",
            address: "http://127.0.0.1:80",
            credentials: {
                username: 'leilo',
                password: 'pass',
            },
        },

        debug: {
            __moduleName: "debug",
            enable: "DEVELOPMENT",
            debugLevel: "normal", // can be none, short, normal, or verbose
        },
    },
};