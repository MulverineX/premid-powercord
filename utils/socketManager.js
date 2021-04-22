import { createServer } from "http";
import socketIo from "socket.io";

const error = (s) => console.error(s);
const success = (s) => console.log(s);

export let io;
export let socket;
export let server;
export let connected = false;

export function init() {
	return new Promise(resolve => {
		//* Create server
		//* create SocketIo server, don't server client
		//* Try to listen to port 3020
		//* If that fails/some other error happens run socketError
		//* If someone connects to socket socketConnection
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
	getDiscordUser()
		.then(user => socket.emit("discordUser", user))
		.catch(_ => socket.emit("discordUser", null));
    
	socket.on("setActivity", setActivity); // set to presenceData.presenceData and ensure presence.clientId is set
	socket.on("clearActivity", clearActivity);
	socket.on("getVersion", () =>
		socket.emit("receiveVersion", '1')
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