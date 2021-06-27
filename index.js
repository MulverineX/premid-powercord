const { Plugin } = require('powercord/entities');
const activity = require('./src/activity');

module.exports = class PreMID extends Plugin {
	startPlugin() { activity.init() }

	pluginWillUnload() { activity.destroy(); }
};
