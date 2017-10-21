// require('leilo-backend')(); //run server
const client = require('../index');
const fs = require('fs');
const testScript = fs.readFileSync('./testScript.js').toString();

const consts = require('../consts');
const localID = consts.localID;
const serverID = consts.serverID;

const working = [];
const tested=[];

const root = "root";
const leilo = "leilo";

function login(creds, callback) {
    const conn = client();

    conn.once(['init', serverID, localID], () => {
        conn.emitNext({
            name: 'auth'
        }, creds);

        conn.on({
            name: 'authSuccess'
        }, () => callback(conn));
    });
}

login({
    username: leilo,
    password: 'pass',
}, initForTest);

function initForTest(conn) {
    conn.emit({
        name: 'createUser',
        src: leilo,
    }, {
        username: root,
        password: "pass",
    });

    conn.emit({
        name: 'updateUserLevel',
        src: leilo,
    }, {
        user: 'root',
        level: 0,
    }, () => {
        working.push('ack callback worked');
        login({
            username: root,
            password: 'pass',
        }, conn2 => actualTest(conn, conn2));
    });
}

function actualTest(conn, conn2) {
    working.push("connect worked");

    createTest(conn2);

    subscribeTest(conn2);

    gcTest(conn2);

    userTest(conn);
}

function createTest(conn2) {
    tested.push('create');
    //create test
    conn2.emit({
        name: 'create',
        path: [],
        src: root,
    }, {
        newObjName: 'cust',
        newObjVal: 'custy',
    }, () => {
        working.push("updateUserLevel worked");
        working.push('create worked');
    });
}

function subscribeTest(conn2) {
    tested.push('subscribe');
    //subscribe test
    conn2.emit({
        name: 'subscribe',
    }, {
        path: ['cust']
    }, () => {
        conn2.once({
            name: 'update',
            path: ['cust'],
        }, () => {
            working.push('subscribe worked');
            unsubscribeTest(conn2);
        });

        updateTest(conn2);
    });
}

function updateTest(conn) {
    tested.push('update');
    conn.once({
        name: 'update',
        path: ['cust'],
    }, () => working.push('update worked'));
    conn.emit({
        name: 'update',
        src: root,
        path: ['cust'],
    }, {
        value: 'abcdef'
    });
}

function unsubscribeTest(conn2) {
    tested.push('unsubscribe');
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
            src: root,
            path: ['cust'],
        }, {
            value: 'ghijkl'
        });
        deleteTest(conn2);
    });
}

function deleteTest(conn2) {
    tested.push('delete');
    conn2.emit({
        name: 'delete',
        src: root,
        path: ['cust']
    }, {}, () => {
        working.push('delete worked');
        scriptTest(conn2)
    });
}

function scriptTest(conn2) {
    tested.push('script');
    //script test
    conn2.once({
        name: 'scriptInstantiated',
    }, (payload) => {
        const sid = payload.scriptInstanceID;
        conn2.emit({
            name: 'requestAccepted',
            src: root,
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
                src: root,
                path: ['users', 'root', 'stuff']
            }, {
                value: 11
            });
        });

    });
    conn2.emitNext({
        name: "instantiateScript",
        src: root,
    }, {
        scriptCode: testScript,
    });
}

function gcTest(conn2) {
    tested.push('gc');
    //gc test
    conn2.emit({
        name: 'create',
        src: root,
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
                src: root,
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
}

function userTest(conn) {
    tested.push('user');
    //user test
    conn.emit({
        name: 'createUser',
        src: leilo,
    }, {
        username: "sunny",
        password: "derp",
    });
    login({
        username: "sunny",
        password: "derp",
    }, (conn3)=>{

        working.push('createUser worked');
        conn3.emit({
            name: 'changePassword',
            src: 'sunny',
        }, {
            password: 'asdf'
        });
        conn3.emit({
            name: 'forceDisconnect',
            dst: localID,
        });
        login({
            username: "sunny",
            password: "asdf",
        }, (conn3) => {
            working.push('changePassword worked');
            conn3.on({
                name: 'userDeleted'
            }, () => working.push('deleteUser worked'));
            conn3.emit(['deleteUser', 'sunny', serverID]);
        });
    });
}

setTimeout(() => console.log(working, tested), 2000);