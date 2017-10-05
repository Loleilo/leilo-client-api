require('leilo-backend')({
    persist: false,
    debugLevel: "none",
}); //run server
const client = require('../index');
const config = require('../config');
const localID = config.localID;
const serverID = config.serverID;

const conn = client('http://127.0.0.1:80', {
    username: "leilo",
    password: "pass",
}, {
    debugLevel: "none",
});

conn.on(['connectSuccess', localID, localID], () => {
    conn.emit(['createUser', '*', '*'], {
        username: "root",
        password: "pass",
    }, () => {
        const conn2 = client('http://127.0.0.1:80', {
            username: "root",
            password: "pass",
        });

        conn2.on(['connectSuccess', localID, localID], () => {
            console.log("worked");
        });
    });
});