Module.register("MMM-Shelly-to-EnergyMonitor",{

	data: {
		solar_now: "--",
		solar_today: "--",
		solar_units_today: "--",

		grid_consumption_now: "--",
		grid_consumption_today: "--",
		grid_consumption_units_today: "--",
		grid_returned_today: "--",
		grid_returned_units_today: "--"
	},

	start: function() {
		var self = this;


		// little helper to immediately execute func before setting the timer
		function setIntervalImmediately(func, interval) {
			func();
			return setInterval(func, interval);
		}

		// set grid timer and call immediately
		setIntervalImmediately(function() {
			var payload = {
				uri: self.config.grid_em3_uri,
				timeout: self.config.timeout
			}
			self.sendSocketNotification("GetShellyGridToEnergyMonitor", payload)
		}, self.config.grid_em3_refreshInterval);

		setIntervalImmediately(function() {
			var payload = {
				uri: self.config.grid_em3_uri_cloud,
				timeout: self.config.timeout,
				device_id: self.config.grid_em3_device_id,
				auth_key: self.config.authkey
			}
			self.sendSocketNotification("GetShellyGridCloud", payload)
		}, self.config.grid_em3_refreshInterval_cloud);


		// set solar timer and call immediately
		setIntervalImmediately(function() {
			var payload = {
				uri: self.config.solar_pm_uri,
				timeout: self.config.solar_pm_timeout,
				solar_pm_min_watts: self.config.solar_pm_min_watts
			}
			self.sendSocketNotification("GetShellySolarToEnergyMonitor", payload)
		}, self.config.solar_pm_refreshInterval);

		setIntervalImmediately(function() {
			var payload = {
				uri: self.config.solar_pm_uri_cloud,
				timeout: self.config.timeout,
				device_id: self.config.solar_pm_device_id,
				auth_key: self.config.authkey
			}
			self.sendSocketNotification("GetShellySolarCloud", payload)
		}, self.config.solar_pm_refreshInterval_cloud);
	},

	// when any method returns, notify the energy-monitor
	socketNotificationReceived: function (notification, payload) {
		var self = this;

		if (notification == "ShellySolarToEnergyMonitor") {
			self.sendNotification("MMM-EnergyMonitor_SOLAR_POWER_UPDATE", payload.power);
		}
		if (notification == "ShellyGridToEnergyMonitor") {
			self.sendNotification("MMM-EnergyMonitor_GRID_POWER_UPDATE", -payload.power);
		}

		if (notification == "ShellySolarCloud") {
			// console.log("Got cloud data for solar");
		}
		if (notification == "ShellyGridCloud") {
			// console.log("Got cloud data for em3 grid");
		}
	}

});
