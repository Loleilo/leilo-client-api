require('leilo-backend')(); //run server
const client = require('../index');
const config = require('../config');
const localID = config.localID;
const serverID = config.serverID;
const fs = require('fs');
const testScript = fs.readFileSync('./testScript.js').toString();

const conn = client('http://127.0.0.1:80', {
    username: "leilo",
    password: "pass",
}, {
    debugLevel: "none",
});

conn.once(['connectSuccess', localID, localID], () => {
    conn.emit({
        name: 'createUser',
    }, {
        username: "root",
        password: "pass",
    });

    conn.emit({
        name: 'updateUserLevel'
    }, {
        user: 'root',
        level: 0,
    }, () => {
        console.log('ack callback worked');
        const conn2 = client('http://127.0.0.1:80', {
            username: "root",
            password: "pass",
        });

        conn2.once(['connectSuccess', localID, localID], () => {
            console.log("connect worked");

            //create test
            conn2.emit({
                name: 'create',
                path: []
            }, {
                newObjName: 'cust',
                newObjVal: 'custy',
            }, () => {
                console.log("updateUserLevel worked");
                console.log('create worked');
            });

            //subscribe test
            conn2.emit({
                name: 'subscribe',
            }, {
                path: ['cust']
            }, () => {
                conn2.once({
                    name: 'update',
                    path: ['cust'],
                }, () => console.log('subscribe worked'));

                updateTest();

                unsubscribeTest();
            });

            function updateTest() {
                conn.once({
                    name: 'update',
                    path: ['cust'],
                }, () => console.log('update worked'));
                conn.emit({
                    name: 'update',
                    path: ['cust'],
                }, {
                    value: 'abcdef'
                });
            }

            function unsubscribeTest() {
                conn2.emit({
                    name: 'unsubscribe',
                }, {
                    path: ['cust']
                }, () => {
                    conn2.once({
                        name: 'update',
                        path: ['cust'],
                    }, () => console.log("unsubscribe didn't work"));
                    conn2.emit({
                        name: 'update',
                        path: ['cust'],
                    }, {
                        value: 'ghijkl'
                    });
                    deleteTest();
                });
            }

            function deleteTest() {
                conn2.emit({
                    name: 'delete',
                    path: ['cust']
                }, {}, () => console.log('delete worked'));
            }

            //gc test
            conn2.emit({
                name: 'create',
                path: []
            }, {
                newObjName: 'cust2',
                newObjVal: 'custy',
            }, () => {
                conn2.emit({
                    name: 'subscribe'
                }, {
                    path: ['cust2']
                }, () => {
                    conn2.emit({
                        name: 'gc',
                        path: ['cust2'],
                    }, ['cleanup', '*', '*']);

                    conn2.once({
                        name: 'delete',
                        path: ['cust2']
                    }, () => console.log('gc worked'));

                    conn2.emit({
                        name: 'cleanup'
                    });
                });
            });

            //script test
            conn2.once({
                name: 'scriptInstantiated'
            }, (payload) => {
                const sid = payload.scriptInstanceID;

                conn2.emit({
                    name: 'requestAccepted',
                    dst: sid,
                }, {
                    firstReqID: 'req1',
                    responseLst: ['accepted', 'reject', 'skip', 'accept', 'accept'],
                });

                conn2.once({
                    name: 'scriptInitDone',
                    src: sid,
                }, () => {
                    console.log('instantiateScript worked');

                    conn2.once({
                        name: 'update detected val=11',
                        src: sid,
                    }, () => console.log('script worked'));
                    conn2.emit({
                        name: 'update',
                        path: ['users', 'root', 'stuff']
                    }, {
                        value: 11
                    });
                });

            });
            conn2.emit({
                name: "instantiateScript"
            }, {
                scriptCode: testScript,
            });

            //user test
            conn.emit({
                name: 'createUser',
            }, {
                username: "sunny",
                password: "derp"
            });
            let conn3 = client('http://localhost:80', {
                username: "sunny",
                password: "derp"
            });
            conn3.once(['connectSuccess', localID, localID], () => {
                console.log('createUser worked');
                conn3.emit({
                    name: 'changePassword'
                }, {
                    password: 'asdf'
                });
                conn3.emit({
                    name: 'forceDisconnect',
                    dst: localID,
                });
                conn3 = client('http://localhost:80', {
                    username: "sunny",
                    password: "asdf"
                });
                conn3.once(['connectSuccess', localID, localID], () => {
                    console.log('changePassword worked');
                    conn3.on({
                        name: 'userDeleted'
                    }, () => console.log('deleteUser worked'));
                    conn3.emit(['deleteUser', localID, serverID]);
                });
            });
        });
    });
});