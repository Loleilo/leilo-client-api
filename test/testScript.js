on({
    name: 'initRun',
    src: '*'
}, () => {
    emit({
        name: 'requestElevated',
        path: ['req1'],
        src: scriptID,
        dst: 'leilo',
    }, {
        evt: {
            name: "do req 1",
        },
    });
    once({
        name: 'requestResponse',
        path: ['req1'],
        src: 'leilo',
    }, (payload) => {
        emit({
            name: 'gudcontent' + payload,
            src: scriptID,
        });
    });

    emit({
        name: 'requestElevated',
        path: ['req2'],
        dst: 'leilo',
        src: scriptID,
    }, {
        evt: {
            name: "do req 2",
        },
    });
    once({
        name: 'requestResponse',
        path: ['req2'],
        src: 'leilo',
    }, (payload) => {
        emit({
            name: 'gudcontent2' + payload,
            src: scriptID,
        });
    });

    emit({
        name: 'requestElevated',
        path: ['req3'],
        dst: 'leilo',
        src: scriptID,
    }, {
        evt: {
            name: "do req 3",
        },
    });
    once({
        name: 'requestResponse',
        path: ['req3'],
        src: 'leilo',
    }, (payload) => {
        emit({
            name: 'gudcontent3' + payload,
            src: scriptID,
        });
    });

    emit({
        name: 'requestElevated',
        path: ['req4'],
        dst: 'leilo',
        src: scriptID,
    }, {
        evt: {
            name: "create",
            path: ['users', 'root'],
            dst: 'leilo',
        },
        payload: {
            newObjName: 'stuff',
            newObjVal: 10,
        }
    });

    emit({
        name: 'requestElevated',
        path: ['req5'],
        dst: 'leilo',
        src: scriptID,
    }, {
        evt: {
            name: "updatePerms",
            path: ['users', 'root', 'stuff'],
            dst: 'leilo',
        },
        payload: {
            user: scriptID,
            perms: {lvl: 3}
        }
    });
    once({
        name: 'requestResponse',
        path: ['req5'],
        src: 'leilo',
    }, () => {
        emit({
            name: 'initDone',
            src: scriptID,
        });
        emit({
            name: 'subscribe',
            dst: 'leilo',
            src: scriptID,
        }, {
            path: ['users', 'root', 'stuff']
        });
        on({
            name: 'update',
            path: ['users', 'root', 'stuff'],
            src: "*",
        }, (payload) => {
            emit({
                name: "update detected val=" + payload.value,
                src: scriptID,
            });
        });
    });
});
emit({
    name: 'script stated running' + scriptID,
    src: scriptID,
});