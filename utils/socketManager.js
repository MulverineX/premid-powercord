const { createServer } = require("http");
const socketIo = require("socket.io");
const { getModule } = require('powercord/webpack');

const error = (s) => console.error(s);
const success = (s) => console.log(s);

let io;
let socket;
let server;
let connected = false;
const connections = [];
let getCurrentUser;

const setActivity = console.log;
const clearActivity = console.log;

module.exports.init = function init() {
	return new Promise(resolve => {
		//* Create server
		//* create SocketIo server, don't server client
		//* Try to listen to port 3020
		//* If that fails/some other error happens run socketError
		//* If someone connects to socket socketConnection
		({getCurrentUser} = getModule(['getCurrentUser'], false));
		server = createServer();
		io = new socketIo.Server(server, {
			serveClient: false,
			allowEIO3: true,
			cors: { origin: "*" }
		});
		server.listen(3020, () => {
			//* Resolve promise
			//* Debug info
			resolve();
			success("Opened socket");
		});
		server.on("error", socketError);
		io.on("connection", socketConnection);
	});
}

module.exports.destroy = async function destroy() {
	connections.forEach(x => x.disconnect());
	await io.close();
	server.close();
	connected = false;
}

function socketConnection(cSocket) {
	//* Show debug
	//* Set exported socket letiable to current socket
	//* Handle setActivity event
	//* Handle clearActivity event
	//* Handle settingsUpdate
	//* Handle presenceDev
	//* Handle version request
	//* Once socket user disconnects run cleanup
	success("Socket connection");
	socket = cSocket;
	const user = getCurrentUser();
	socket.emit('discordUser', user);

	socket.on("setActivity", setActivity); // set to presenceData.presenceData and ensure presence.clientId is set
	socket.on("clearActivity", clearActivity);
	socket.on("getVersion", () =>
		socket.emit("receiveVersion", '2.2.0'.replace(/[\D]/g, ""))
	);
	socket.once("disconnect", () => {
		connected = false;
		//* Show debug
		//* Destroy all open RPC connections
		error("Socket disconnection.");
	});
	connected = true;
}

//* Runs on socket errors
function socketError(e) {
	//* Show debug
	//* If port in use
	error(e.message);
	if (e.code === "EADDRINUSE") {
		/*dialog.showErrorBox(
			"Oh noes! Port error...",
			`${app.name} could not bind to port ${e.port}.\nIs ${app.name} running already?`
		);*/
	}
}