const { Plugin } = require('powercord/entities');
const { getModule, React } = require('powercord/webpack');
//const Settings = require('./Settings');
const socketManager = require('./utils/socketManager');

let app_id = '711416957718757418';

module.exports = class PreMID extends Plugin {
	reloadRPC() {
		const { SET_ACTIVITY } = getModule(['INVITE_BROWSER'], false);
		SET_ACTIVITY.handler({
			socket: {
				id: 100,
				application: {
					id: app_id,
					name: 'Premid',
				},
				transport: 'ipc',
			},
			args: {
				pid: 10,
				activity: this.game(),
			},
		});
	}

	startPlugin() {
		socketManager.init();
		//this.reloadRPC = this.reloadRPC; // this will be used in settings to reload
		/*powercord.api.settings.registerSettings(this.entityID, {
			category: this.entityID,
			label: 'Custom RPC',
			render: props =>
				React.createElement(Settings, {
					reloadRPC: this.reloadRPC,
					...props,
				}),
		});*/

		const { SET_ACTIVITY } = getModule(['INVITE_BROWSER'], false);
		// without it sometimes the rpc wouldn't show
		// setTimeout(() => {
		// 	SET_ACTIVITY.handler({
		// 		socket: {
		// 			id: 100,
		// 			application: {
		// 				id: app_id,
		// 				name: 'Premid',
		// 			},
		// 			transport: 'ipc',
		// 		},
		// 		args: {
		// 			pid: 10,
		// 			activity: presence,
		// 		},
		// 	});
		// }, 5000);
	}

	pluginWillUnload() {
		const { SET_ACTIVITY } = getModule(['INVITE_BROWSER'], false);
		SET_ACTIVITY.handler({
			socket: {
				id: 100,
				application: {
					id: app_id,
					name: 'Premid',
				},
				transport: 'ipc',
			},
			args: {
				pid: 10,
				activity: undefined,
			},
		});
		socketManager.destroy();
		//powercord.api.settings.unregisterSettings(this.entityID);
	}
};
