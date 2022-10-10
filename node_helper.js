var NodeHelper = require("node_helper");

const request = require('request');

module.exports = NodeHelper.create({

	start: function() {

	},


	// Frontend module pings the node helper to fetch data from Shelly PM
	socketNotificationReceived: function (notification, payload) {
		self = this;

		if (notification == "GetShellySolarToEnergyMonitor"){
			request(payload.uri, {json: true, timeout: payload.timeout}, (err, res, body) => {
				if (err) { return console.log(err); }
				var power = body['switch:0'].apower
				// the workaround such that the line is rendered and shown as data is available
				if (power <= payload.solar_pm_min_watts) {
					power = 0.0
				}

				payload_solar={
					power: power
				}
				self.sendSocketNotification('ShellySolarToEnergyMonitor', payload_solar);
			});
		}

		if (notification == "GetShellyGridToEnergyMonitor"){
			request(payload.uri, {json: true, timeout: payload.timeout}, (err, res, body) => {
				if (err) { return console.log(err); }

				payload_grid={
					power: body.total_power
				}
				self.sendSocketNotification('ShellyGridToEnergyMonitor', payload_grid);
			});
		}
	}
});
