// require('leilo-backend')(); //run server
const client = require('../index');
const fs = require('fs');
const testScript = fs.readFileSync('./testScript.js').toString();

const conn = client();

const consts = require('../consts');
const localID = consts.localID;
const serverID = consts.serverID;

const working=[];

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
        working.push('ack callback worked');
        const conn2 = client({
            modules: {
                wsConnector: {
                    credentials: {
                        username: "root",
                        password: "pass",
                    }
                }
            }
        });

        conn2.once(['connectSuccess', localID, localID], () => {
            working.push("connect worked");

            //create test
            conn2.emit({
                name: 'create',
                path: []
            }, {
                newObjName: 'cust',
                newObjVal: 'custy',
            }, () => {
                working.push("updateUserLevel worked");
                working.push('create worked');
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
                }, () => working.push('subscribe worked'));

                updateTest();

                unsubscribeTest();
            });

            function updateTest() {
                conn.once({
                    name: 'update',
                    path: ['cust'],
                }, () => working.push('update worked'));
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
                    }, () => working.push("unsubscribe didn't work"));
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
                }, {}, () => working.push('delete worked'));
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
                    }, () => working.push('gc worked'));

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
                    working.push('instantiateScript worked');

                    conn2.once({
                        name: 'update detected val=11',
                        src: sid,
                    }, () => working.push('script worked'));
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
                password: "derp",
            });
            let conn3 = client({
                modules: {
                    wsConnector: {
                        credentials: {
                            username: "sunny",
                            password: "derp",
                        }
                    }
                }
            });
            conn3.once(['connectSuccess', localID, localID], () => {
                working.push('createUser worked');
                conn3.emit({
                    name: 'changePassword'
                }, {
                    password: 'asdf'
                });
                conn3.emit({
                    name: 'forceDisconnect',
                    dst: localID,
                });
                conn3 = client({
                    modules: {
                        wsConnector: {
                            credentials: {
                                username: "sunny",
                                password: 'asdf',
                            }
                        }
                    }
                });
                conn3.once(['connectSuccess', localID, localID], () => {
                    working.push('changePassword worked');
                    conn3.on({
                        name: 'userDeleted'
                    }, () => working.push('deleteUser worked'));
                    conn3.emit(['deleteUser', localID, serverID]);
                });
            });
        });
    });
});

setTimeout(()=>console.log(working), 2000);