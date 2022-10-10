Module.register("MMM-Shelly-to-EnergyMonitor",{

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
				timeout: self.config.grid_em3_timeout
			}
			self.sendSocketNotification("GetShellyGridToEnergyMonitor", payload)
		}, this.config.grid_em3_refreshInterval);

		// set solar timer and call immediately
		setIntervalImmediately(function() {
			var payload = {
				uri: self.config.solar_pm_uri,
				timeout: self.config.solar_pm_timeout,
				solar_pm_min_watts: self.config.solar_pm_min_watts
			}
			self.sendSocketNotification("GetShellySolarToEnergyMonitor", payload)
		}, this.config.solar_pm_refreshInterval);
	},

	// when any method returns, notify the energy-monitor
	socketNotificationReceived: function(notification, payload) {
		if (notification == "ShellySolarToEnergyMonitor") {
			this.sendNotification("MMM-EnergyMonitor_SOLAR_POWER_UPDATE", payload.power);
		}
		if (notification == "ShellyGridToEnergyMonitor") {
			this.sendNotification("MMM-EnergyMonitor_GRID_POWER_UPDATE", -payload.power);
		}
	}

});
