const { createServer } = require("http");
const socketIo = require("socket.io");
const { getModule, http: { get } } = require('powercord/webpack');

const error = (s) => console.error(s);
const success = (s) => console.log(s);

let io;
let socket;
let server;
let getCurrentUser;

let applications = {};

const { SET_ACTIVITY } = getModule(['INVITE_BROWSER'], false);

const setActivity = async (rpc) => {
    const presence = rpc.presenceData;

    const activity = {};

    activity.details = presence.details || '';
    activity.state = presence.state || '';

    if (presence.buttons && presence.buttons.length !== 0) activity.buttons = presence.buttons;

    if (presence.startTimestamp) {
        activity.timestamps = {
            start: presence.startTimestamp
        }
        if (presence.endTimestamp) activity.timestamps.end = presence.endTimestamp
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
    SET_ACTIVITY.handler({
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
    });
};
const clearActivity = () => {
    console.log('clearedActivity');
    SET_ACTIVITY.handler({
        socket: {
            id: 100,
            application: {
                id: "463097721130188830",
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
            cors: { origin: "*" }
        });
        server.listen(3020, () => {
            resolve();
            success("Opened socket");
        });
        server.on("error", socketError);
        io.on("connection", socketConnection);
    });
}

module.exports.destroy = async function destroy() {
    clearActivity();

    await io.close();
    server.close();
}

function socketConnection(cSocket) {
    success("Socket connection");
    socket = cSocket;
    const user = getCurrentUser();
    socket.emit('discordUser', user);

    socket.on("setActivity", setActivity);
    socket.on("clearActivity", clearActivity);
    socket.on("getVersion", () =>
        socket.emit("receiveVersion", '2.2.0'.replace(/[\D]/g, ""))
    );
    socket.once("disconnect", () => { error("Socket disconnection"); });
}

function socketError(e) {
    error(e.message);

    if (e.code === "EADDRINUSE") {
        powercord.api.notices.sendToast(`premid-boundPort-${Math.floor(Math.random() * 200)}`, {
            header: 'Websocket Port Already Bound',
            timeout: 3000,
        });
    }
}