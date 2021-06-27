const { readdirSync, readFileSync, watch, unwatchFile } = require('fs');

const info = (s) => console.log(`%c[PreMiD]%c ${s}`, 'color: #7289da; font-weight: bold', 'font-weight: bold');

let presenceDevWatchedFiles = [],
	currWatchPath = '',
	currWatcher = null;


// Haha watch doesn't actually work at all and I have no idea why, also, when I remove it, it breaks, hahaha, kill me. no there isn't a reload hotkey, my sanity demands it so, remove it and readd it
async function watchDir(path, socket) {
	currWatchPath = path + '/';
	let files = readdirSync(path);

	if (currWatcher) await currWatcher.close();

    currWatcher = watch(currWatchPath);

	currWatcher.on('all', eventName => {
		files = readdirSync(currWatchPath);

		console.log(eventName, currWatchPath, files);

		readFiles(files, currWatchPath, socket);
	});

	readFiles(files, path, socket);
}

async function readFiles(files, path, socket) {
	//* Send files to extension
    const files_ = await Promise.all(
        files.map(f => {
			console.log()
            const ext = _.last(f.split('.'));
            if (ext === 'json')
                return {
                    file: f,
                    contents: JSON.parse(readFileSync(`${path}/${f}`).toString())
                };
            else if (ext === 'js')
                return {
                    file: f,
                    contents: readFileSync(`${path}/${f}`).toString()
                };
            else return;
        })
    );
    console.log(files_)
	socket.emit('localPresence', {
		files: files_
	});
}

module.exports.openFileDialog = async function openFileDialog(socket) {
	//* Open file dialog
	//* If user cancels
	//* Unwatch all still watched files
	//* Watch directory
	let path = await DiscordNative.fileManager.showOpenDialog({
		title: 'Select Presence Folder',
		message:
			'Please select the folder that contains the presence you want to load.\n(metadata.json, presence.js, iframe.js)',
		buttonLabel: 'Load Presence',
		properties: ['openDirectory']
	});
	if (path.length === 0) {
		//* Show debug
		//* return
		info('Presence load canceled.');
		return;
	}
	info(`Watching ${path[0]}`);
	if (presenceDevWatchedFiles.length > 0)
		await Promise.all(
			presenceDevWatchedFiles.map(f => unwatchFile(currWatchPath + f))
		);

	watchDir(path[0], socket);
}