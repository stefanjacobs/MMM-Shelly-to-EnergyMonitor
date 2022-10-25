const NodeHelper = require('node_helper');
const axios = require("axios");
const agent = require("agentkeepalive");

axios.defaults.timeout = 10000;


module.exports = NodeHelper.create({

    start: function() {
		var self = this;
		self.solarLanHttpAgent = new agent({ maxSockets: 20, maxFreeSockets: 10, timeout: 60000, freeSocketTimeout: 30000 });
		self.gridLanHttpAgent = new agent({ maxSockets: 20, maxFreeSockets: 10, timeout: 60000, freeSocketTimeout: 30000 });
		self.solarCloudHttpAgent = new agent({ maxSockets: 20, maxFreeSockets: 10, timeout: 120000, freeSocketTimeout: 30000 });
		self.gridCloudHttpAgent = new agent({ maxSockets: 20, maxFreeSockets: 10, timeout: 120000, freeSocketTimeout: 30000 });
	},

	getPrintDate: function() {
		var currentdate = new Date();
		var options = { hour: 'numeric', minute: 'numeric', second: 'numeric' };
		return new Intl.DateTimeFormat('de', options).format(currentdate);
	},

	getCloudDate: function() {
		var currentdate = new Date();
		var month = '' + (currentdate.getMonth() + 1);
		var day = '' + currentdate.getDate();
		var year = currentdate.getFullYear();
		if (month.length < 2)
			month = '0' + month;
		if (day.length < 2)
			day = '0' + day;
		// return [year, month, day].join('-') + "%20%2000%3A00%3A00";
		return [year, month, day].join('-') + "  00:00:00";
	},

	getFilterDate: function() {
		var currentdate = new Date();
		var month = '' + (currentdate.getMonth() + 1);
		var day = '' + currentdate.getDate();
		var year = currentdate.getFullYear();
		if (month.length < 2)
			month = '0' + month;
		if (day.length < 2)
			day = '0' + day;
		return [year, month, day].join('-');
	},

	// Frontend module pings the node helper to fetch data from Shelly PM
	socketNotificationReceived: function (notification, payload) {
		var self = this;

		if (notification == "GetShellySolarToEnergyMonitor"){
			axios.get(payload.uri, {timeout: payload.timeout, httpAgent: self.solarLanHttpAgent} )
			.then(response => {
				var result={
					power: response.data['switch:0'].apower
				}
				if (result.power <= payload.solar_pm_min_watts) {
					result.power = 0.0
				}
				console.log(result);
				self.sendSocketNotification('ShellySolarToEnergyMonitor', result);
			})
			.catch(error => {
				return console.log(error);
			})
		}

		if (notification == "GetShellyGridToEnergyMonitor"){
			axios.get(payload.uri, {timeout: payload.timeout, httpAgent: self.gridLanHttpAgent} )
			.then(response => {
				var result = {
					power: response.data.total_power
				}
				console.log(result);
				self.sendSocketNotification('ShellyGridToEnergyMonitor', result);
			})
			.catch(error => {
				return console.log(error);
			})

		}

		if (notification == "GetShellySolarCloud") {
			// curl -d "channel=0&date_range=day&date=20221015&id=485519c9b0a5&auth_key=MTIxZTUxdWlk356CAD19444095CAF7832666D85E367AB2454479AA703DED4E0A86313C3A3519481AE4C7E22CF538" -H "Content-Type: application/x-www-form-urlencoded" -X POST "https://shelly-39-eu.shelly.cloud/statistics/relay/consumption"
			axios.post( payload.uri,
				new URLSearchParams({
					'channel': '0',
					'date_range': 'day',
					'date_from': self.getCloudDate(),
					'id': payload.device_id,
					'auth_key': payload.auth_key
				}),
				{timeout: payload.timeout, httpAgent: self.solarCloudHttpAgent})
			.then(response => {
				const {data} = response.data;
				var result = {
					power: data.total,
					power_unit: data.units.consumption
				}
				console.log(result);
				self.sendSocketNotification("ShellySolarCloud", result);
			})
			.catch(error => {
				return console.log(error)
			})
		}

		if (notification == "GetShellyGridCloud") {
			// curl -d "channel=0&date_range=day&date_from=2022-10-15%20%2000%3A00%3A00&id=485519c9b0a5&auth_key=MTIxZTUxdWlk356CAD19444095CAF7832666D85E367AB2454479AA703DED4E0A86313C3A3519481AE4C7E22CF538" -H "Content-Type: application/x-www-form-urlencoded" -X POST "https://shelly-39-eu.shelly.cloud/statistics/emeter/consumption3p"
			axios.post( payload.uri,
				new URLSearchParams({
					'channel': '0',
					'date_range': 'day',
					'date_from': self.getCloudDate(),
					'id': payload.device_id,
					'auth_key': payload.auth_key
				}),
				{timeout: payload.timeout, httpAgent: self.gridCloudHttpAgent})
			.then(response => {
				const {data} = response.data;
				result = {
					power: data.total_c3,
					power_unit: data.units.consumption,
					returned: data.total_r3,
					returned_unit: data.units.reversed
				}
				console.log(result);
				self.sendSocketNotification("ShellyGridCloud", result);
			})
			.catch(error => {
				return console.log(error)
			})
		}

	}
});

