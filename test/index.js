// require('leilo-backend')(); //run server
const client = require('../index');
const config = require('../config');
const localID = config.localID;

const conn = client('http://127.0.0.1:80', {
    username: "leilo",
    password: "pass",
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

        conn.on(['connectSuccess', localID, localID], () => {
            console.log("worked");
        });
    });
});