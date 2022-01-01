const { createServer } = require('http');
const socketIo = require('socket.io');
const { getModule, http: { get } } = require('powercord/webpack');

const { openFileDialog } = require('./sideload')

let io;
let server;
let getCurrentUser;

let applications = {};

const version = '1.1.0'

const log_prefix = 'color: #7289da; font-weight: bold';

let previous_log;

const error = (s) => console.warn(`%c[PreMiD]%c ${s}`, log_prefix, 'font-weight: bold');
const success = (s) => console.log(`%c[PreMiD]%c ${s}`, log_prefix, 'font-weight: bold');

const { SET_ACTIVITY } = getModule(['SET_ACTIVITY'], false);

const setActivity = async (rpc) => {
    const presence = rpc.presenceData;

    const activity = {};

    activity.details = presence.details || '';
    activity.state = presence.state || '';

    if (presence.buttons && presence.buttons.length !== 0) activity.buttons = presence.buttons;

    if (presence.startTimestamp || presence.endTimestamp) {
        activity.timestamps = {};

        if (presence.startTimestamp) activity.timestamps.start = presence.startTimestamp;
        if (presence.endTimestamp) activity.timestamps.end = presence.endTimestamp;
    }

    if (presence.largeImageKey) {
        activity.assets = { large_image: presence.largeImageKey, large_text: presence.largeImageText };

        if (presence.smallImageKey) {
            activity.assets.small_image = presence.smallImageKey;

            if (presence.smallImageText) activity.assets.small_text = presence.smallImageText;
        }
    }

    let name = 'PreMiD';

    if (applications[rpc.clientId]) name = applications[rpc.clientId];
    else {
        const data = await get({url: `/applications/${rpc.clientId}/public?with_guild=false`});

        name = data.body.name;
        applications[rpc.clientId] = name;
    }

    if (!activity.assets?.large_text) activity.assets = { large_text: `PreMiD pc${version}`};

    else activity.assets.large_text = `PreMiD pc${version} • Ext ${activity.assets.large_text.split('Ext ')[1]}`

    const handling = {
        isSocketConnected: () => true,
        socket: {
            id: 100,
            application: {
                id: rpc.clientId,
                name: name,
            },
            transport: 'ipc',
        },
        args: {
            pid: 10,
            activity: activity,
        },
    };

    SET_ACTIVITY.handler(handling).then((e) => {
        let extras = '';

        if (e.timestamps) extras+= `\nTimes: ${Object.keys(e.timestamps).join(' ')}`;
        if (e.metadata?.button_urls) extras += `\nButtons: ${e.metadata.button_urls.join(' ')}`;
        if (e.assets?.large_image.substring(0,12) === 'mp:external/') extras += `\nLarge Image URL: ${e.assets.large_image.match(/mp:external\/(?:.{43})\/(.+)/)[1]} `;
        if (e.assets?.small_image.substring(0,12) === 'mp:external/') extras += `\nSmall Image URL: ${e.assets.small_image.match(/mp:external\/(?:.{43})\/(.+)/)[1]} `;

        const log = `%c[PreMiD]%c Activity set\n\n${e.name}%c • ${e.assets?.small_text}%c\n${e.details}\n${e.state}%c${extras}\n`;

        if (log !== previous_log) console.log(log,
            log_prefix,
            'font-weight: bold;', '',
            'margin-left: .5rem', ''
        );

        previous_log = log;
    });
};
const clearActivity = () => {
    console.log('clearedActivity');
    SET_ACTIVITY.handler({
        socket: {
            id: 100,
            application: {
                id: '463097721130188830',
                name: 'PreMiD',
            },
            transport: 'ipc',
        },
        args: {
            pid: 10,
            activity: undefined,
        },
    });
};

module.exports.init = function init() {
    return new Promise(resolve => {
        ({ getCurrentUser } = getModule(['getCurrentUser'], false));
        server = createServer();
        io = new socketIo.Server(server, {
            serveClient: false,
            allowEIO3: true,
            cors: { origin: '*' }
        });
        server.listen(3020, () => {
            resolve();
            success('WS starting on 3020');
        });
        server.on('error', socketError);
        io.on('connection', socketConnection);
    });
}

module.exports.destroy = async function destroy() {
    clearActivity();

    await io.close();
    server.close();
}

function socketConnection(socket) {
    success('WS Connecting');

    socket.on('getVersion', () =>
        socket.emit('receiveVersion', '2.2.0'.replace(/[\D]/g, ''))
    );

    const user = getCurrentUser();
    socket.emit('discordUser', user);

    socket.on('setActivity', setActivity);
    socket.on('clearActivity', clearActivity);

    socket.on('selectLocalPresence', () => openFileDialog(socket))

    socket.once('disconnect', () => error('WS Disconnected'));
}

function socketError(e) {
    error(`WS: ${e.message}`);

    if (e.code === 'EADDRINUSE') {
        powercord.api.notices.sendToast(`premid-boundPort-${Math.floor(Math.random() * 200)}`, {
            header: 'PreMiD Websocket Port Already Bound',
            content: 'Cause: PreMiD App/Dameon still installed/running, residual Discord background processes running from crashes, etc.',
            timeout: 3000,
        });
    }
}
