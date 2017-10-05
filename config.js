module.exports = {
    serverID: "leilo", //username of server
    localID: "local", //username used for internal events in client

    serverVersionRequirements: ">=1.0.2", //server serverVersionRequirements match

    pathMarker: 'path',//indicator of path in event array

    //default value for max. number of listeners in event engine
    engineMaxListeners: 30,

    debugLevel: "normal", // can be none, short, normal, or verbose
};