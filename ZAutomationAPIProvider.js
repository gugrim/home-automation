/*** ZAutomationAPI Provider **************************************************

Version:
-------------------------------------------------------------------------------
Author: Gregory Sitnin <sitnin@z-wave.me>
Copyright: (c) ZWave.Me, 2013

******************************************************************************/

// ----------------------------------------------------------------------------
// --- ZAutomationAPIWebRequest
// ----------------------------------------------------------------------------

executeFile("router.js");

function ZAutomationAPIWebRequest(controller) {
	ZAutomationAPIWebRequest.super_.call(this);

	this.ROLE = controller.auth.ROLE;

	this.router = new Router("/v1");
	this.controller = controller;
	this.res = {
		status: 200,
		headers: {
			"Content-Type": "application/json; charset=utf-8"
		},
		body: null
	};

	this.registerRoutes();
};

var ZAutomationWebRequest = ZAutomationWebRequest || function() {};
inherits(ZAutomationAPIWebRequest, ZAutomationWebRequest);

_.extend(ZAutomationAPIWebRequest.prototype, {
	registerRoutes: function() {
		this.router.get("/status", this.ROLE.USER, this.statusReport);
		this.router.get("/session", this.ROLE.ANONYMOUS, this.verifySession);
		this.router.post("/login", this.ROLE.ANONYMOUS, this.verifyLogin);
		this.router.get("/logout", this.ROLE.USER, this.doLogout);
		this.router.get("/notifications", this.ROLE.USER, this.exposeNotifications);
		this.router.put("/notifications", this.ROLE.ADMIN, this.redeemNotifications);
		this.router.del("/notifications", this.ROLE.ADMIN, this.deleteNotifications);
		this.router.get("/devices", this.ROLE.USER, this.listDevices);
		this.router.get("/restart", this.ROLE.ADMIN, this.restartController);
		this.router.get("/locations", this.ROLE.USER, this.listLocations);
		this.router.get("/profiles", this.ROLE.USER, this.listProfiles);
		this.router.get("/namespaces", this.ROLE.ADMIN, this.listNamespaces);
		this.router.post("/profiles", this.ROLE.ADMIN, this.createProfile);
		this.router.get("/locations/add", this.ROLE.ADMIN, this.addLocation);
		this.router.post("/locations", this.ROLE.ADMIN, this.addLocation);
		this.router.get("/locations/remove", this.ROLE.ADMIN, this.removeLocation);
		this.router.get("/locations/update", this.ROLE.ADMIN, this.updateLocation);
		this.router.get("/modules", this.ROLE.ADMIN, this.listModules);
		this.router.get("/modules/categories", this.ROLE.ADMIN, this.listModulesCategories);

		// module installation / update
		this.router.post("/modules/install", this.ROLE.ADMIN, this.installModule);
		this.router.post("/modules/update", this.ROLE.ADMIN, this.updateModule);

		// module tokens
		this.router.get("/modules/tokens", this.ROLE.ADMIN, this.getModuleTokens);
		this.router.put("/modules/tokens", this.ROLE.ADMIN, this.storeModuleToken);
		this.router.del("/modules/tokens", this.ROLE.ADMIN, this.deleteModuleToken);

		this.router.get("/instances", this.ROLE.ADMIN, this.listInstances);
		this.router.post("/instances", this.ROLE.ADMIN, this.createInstance);

		this.router.post("/upload/file", this.ROLE.ADMIN, this.uploadFile);

		// patterned routes, right now we are going to just send in the wrapper
		// function. We will let the handler consumer handle the application of
		// the parameters.
		this.router.get("/devices/:v_dev_id/command/:command_id", this.ROLE.USER, this.performVDevCommandFunc);
		this.router.get("/devices/:v_dev_id/referenced", this.ROLE.ADMIN, this.getDeviceReference);

		this.router.get("/locations/:location_id/namespaces/:namespace_id", this.ROLE.ADMIN, this.getLocationNamespacesFunc);
		this.router.get("/locations/:location_id/namespaces", this.ROLE.ADMIN, this.getLocationNamespacesFunc);

		this.router.del("/locations/image/:location_id", this.ROLE.ADMIN, this.removeLocationImage, [parseInt]);
		this.router.del("/locations/:location_id", this.ROLE.ADMIN, this.removeLocation, [parseInt]);
		this.router.put("/locations/:location_id", this.ROLE.ADMIN, this.updateLocation, [parseInt]);
		this.router.get("/locations/:location_id", this.ROLE.ADMIN, this.getLocationFunc);

		this.router.get("/notifications/:notification_id", this.ROLE.USER, this.exposeNotifications, [parseInt]);
		this.router.del("/notifications/:notification_id", this.ROLE.USER, this.deleteNotifications, [parseInt]);
		this.router.put("/notifications/:notification_id", this.ROLE.USER, this.redeemNotifications, [parseInt]);

		this.router.post("/profiles/qrcode/:profile_id", this.ROLE.USER, this.getQRCodeString, [parseInt]);
		this.router.del("/profiles/:profile_id/token/:token", this.ROLE.USER, this.removeToken, [parseInt, undefined]);

		this.router.put("/profiles/:profile_id/token/:token", this.ROLE.USER, this.permanentToken, [parseInt, undefined]);

		this.router.get("/profiles/token/local/:profile_id", this.ROLE.ADMIN, this.generateLocalAccessToken, [parseInt]);

		this.router.del("/profiles/:profile_id", this.ROLE.ADMIN, this.removeProfile, [parseInt]);
		this.router.put("/profiles/:profile_id", this.ROLE.USER, this.updateProfile, [parseInt]);
		this.router.get("/profiles/:profile_id", this.ROLE.USER, this.listProfiles, [parseInt]);
		this.router.del("/profile", this.ROLE.USER, this.removeOwnProfile);
		this.router.post("/oauth2", this.ROLE.ADMIN, this.createOAuth2Profile);

		this.router.get("/notificationFiltering", this.ROLE.USER, this.notificationFilteringGet);
		this.router.put("/notificationFiltering", this.ROLE.USER, this.notificationFilteringSet);
		this.router.get("/notificationChannels", this.ROLE.USER, this.notificationChannelsGet);
		this.router.get("/notificationChannels/all", this.ROLE.ADMIN, this.notificationChannelsGetAll);

		this.router.post("/auth/forgotten", this.ROLE.ANONYMOUS, this.restorePassword);
		this.router.post("/auth/forgotten/:profile_id", this.ROLE.ANONYMOUS, this.restorePassword, [parseInt]);
		this.router.put("/auth/update/:profile_id", this.ROLE.ANONYMOUS, this.updateProfileAuth, [parseInt]);

		this.router.put("/devices/:dev_id", this.ROLE.USER, this.setVDevFunc);
		this.router.get("/devices/:dev_id", this.ROLE.USER, this.getVDevFunc);

		this.router.get("/instances/:instance_id", this.ROLE.ADMIN, this.getInstanceFunc);
		this.router.put("/instances/:instance_id", this.ROLE.ADMIN, this.reconfigureInstanceFunc, [parseInt]);
		this.router.del("/instances/:instance_id", this.ROLE.ADMIN, this.deleteInstanceFunc, [parseInt]);

		this.router.post("/modules/reset/:module_id", this.ROLE.ADMIN, this.resetModule);
		this.router.del("/modules/delete/:module_id", this.ROLE.ADMIN, this.deleteModule);

		// reinitialize apps from /modules or /userModules directory
		this.router.get("/modules/reinitialize/:module_id", this.ROLE.ADMIN, this.reinitializeModule);

		this.router.get("/modules/categories/:category_id", this.ROLE.ADMIN, this.getModuleCategoryFunc);
		this.router.get("/modules/transform/reverse", this.ROLE.ADMIN, this.revertTransformModuleFlag);
		this.router.post("/modules/transform", this.ROLE.ADMIN, this.transformModule);

		this.router.get("/modules/:module_id", this.ROLE.ADMIN, this.getModuleFunc);

		this.router.get("/namespaces/:namespace_id", this.ROLE.ADMIN, this.getNamespaceFunc);

		this.router.get("/load/modulemedia/:module_name/:file_name", this.ROLE.ANONYMOUS, this.loadModuleMedia);

		this.router.get("/load/image/:img_name", this.ROLE.ANONYMOUS, this.loadImage);

		this.router.get("/backup", this.ROLE.ADMIN, this.backup);
		this.router.post("/restore", this.ROLE.ADMIN, this.restore);
		this.router.get("/resetToFactoryDefault", this.ROLE.ADMIN, this.resetToFactoryDefault);

		// skins tokens
		this.router.get("/skins/tokens", this.ROLE.ADMIN, this.getSkinTokens);
		this.router.put("/skins/tokens", this.ROLE.ADMIN, this.storeSkinToken);
		this.router.del("/skins/tokens", this.ROLE.ADMIN, this.deleteSkinToken);

		this.router.get("/skins", this.ROLE.ADMIN, this.getSkins);
		this.router.post("/skins/install", this.ROLE.ADMIN, this.addOrUpdateSkin);
		this.router.put("/skins/update/:skin_id", this.ROLE.ADMIN, this.addOrUpdateSkin);
		this.router.get("/skins/setToDefault", this.ROLE.ADMIN, this.setDefaultSkin);
		this.router.get("/skins/active", this.ROLE.ANONYMOUS, this.getActiveSkin);
		this.router.get("/skins/:skin_id", this.ROLE.ADMIN, this.getSkin);
		this.router.put("/skins/:skin_id", this.ROLE.ADMIN, this.activateOrDeactivateSkin);
		this.router.del("/skins/:skin_id", this.ROLE.ADMIN, this.deleteSkin);

		this.router.get("/icons", this.ROLE.ADMIN, this.getIcons);
		this.router.del("/icons/:icon_id", this.ROLE.ADMIN, this.deleteIcons);
		this.router.post("/icons/upload", this.ROLE.ADMIN, this.uploadIcon);
		this.router.post("/icons/install", this.ROLE.ADMIN, this.addOrUpdateIcons);

		this.router.get("/system/webif-access", this.ROLE.ADMIN, this.setWebifAccessTimout);
		this.router.get("/system/reboot", this.ROLE.ADMIN, this.rebootBox);
		this.router.get("/system/wifiCli/settings", this.ROLE.ADMIN, this.getWiFiCliSettings);
		this.router.post("/system/wifiCli/settings", this.ROLE.ADMIN, this.setWiFiCliSettings);
		this.router.get("/system/connectionType", this.ROLE.ADMIN, this.getConnectionType);

		this.router.post("/system/timezone", this.ROLE.ADMIN, this.setTimezone);
		this.router.get("/system/time/get", this.ROLE.ANONYMOUS, this.getTime);
		this.router.get("system/time/ntp/:action", this.ROLE.ADMIN, this.configNtp);

		this.router.get("/system/remote-id", this.ROLE.ANONYMOUS, this.getRemoteId);
		this.router.get("/system/ip-address", this.ROLE.ANONYMOUS, this.getIPAddress);
		this.router.get("/system/first-access", this.ROLE.ANONYMOUS, this.getFirstLoginInfo);
		this.router.get("/system/info", this.ROLE.ANONYMOUS, this.getSystemInfo);

		this.router.post("/system/wifi/settings", this.ROLE.ADMIN, this.setWifiSettings);
		this.router.get("/system/wifi/settings", this.ROLE.ADMIN, this.getWifiSettings);

		this.router.get("/system/zwave/deviceInfoGet", this.ROLE.ADMIN, this.zwaveDeviceInfoGet);
		this.router.get("/system/zwave/deviceInfoUpdate", this.ROLE.ADMIN, this.zwaveDeviceInfoUpdate);
		this.router.get("/system/zwave/vendorsInfoGet", this.ROLE.ADMIN, this.zwaveVendorsInfoGet);
		this.router.get("/system/zwave/vendorsInfoUpdate", this.ROLE.ADMIN, this.zwaveVendorsInfoUpdate);

		this.router.put("/devices/reorder", this.ROLE.ADMIN, this.reorderDevices);
		
		this.router.get("/redirect", this.ROLE.ANONYMOUS, this.redirectURL);
		this.router.post("/redirect", this.ROLE.ANONYMOUS, this.redirectURL);
		
		this.router.get("/demultiplex/:paths", this.ROLE.ANONYMOUS, this.demultiplex);

		this.router.get('/expert/deviceDescription/:deviceId', this.ROLE.ADMIN, this.getDeviceDescription, [parseInt])
	},

	// Used by the android app to request server status
	statusReport: function() {
		var currentDateTime = new Date(),
			reply = {
				error: null,
				data: 'OK',
				code: 200
			};

		if (Boolean(this.error)) {
			reply.error = "Internal server error. Please fill in bug report with request_id='" + this.error + "'";
			reply.data = null;
			reply.code = 503;
			reply.message = "Service Unavailable";
		}

		return reply;
	},

	setLogin: function(profile, req) {
		var sid, resProfile = {};

		sid = this.controller.auth.checkIn(profile, req);

		resProfile = this.controller.safeProfile(profile, ["authTokens"]);
		resProfile.sid = sid;

		if (profile.password !== 'admin' && !this.controller.config.hasOwnProperty('firstaccess') || this.controller.config.firstaccess === true) {
			this.controller.config.firstaccess = false;
		}

		// if showWelcome flag is set in controller add showWelcome flag to profile and remove it from controller
		if (!this.controller.config.firstaccess && this.controller.config.showWelcome) {
			resProfile.showWelcome = true;

			delete this.controller.config.showWelcome;
			this.controller.saveConfig(true);
		}

		return {
			error: null,
			data: resProfile,
			code: 200,
			headers: {
				"ZWAYSession": resProfile.sid,
				"Set-Cookie": "ZWAYSession=" + sid + "; Path=/" // set cookie - it will duplicate header just in case client prefers cookies
			}
		};
	},
	// Method to return a 401 to the user
	denyLogin: function(error) {
		return {
			error: error,
			data: null,
			code: 401,
			suppress401Auth: true, // to suppress basic auth form from the browser
			headers: {
				"Set-Cookie": "ZWAYSession=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT" // clean cookie
			}
		}
	},
	// Returns user session information for the smarthome UI
	verifySession: function() {
		var auth = controller.auth.resolve(this.req, controller.auth.ROLE.USER);

		if (!auth) {
			return this.denyLogin("No valid user session found");
		}

		var profile = _.find(this.controller.profiles, function(profile) {
			return profile.id === auth.user;
		});

		res = _.extend(this.controller.safeProfile(profile, ["authTokens"]), {sid: controller.auth.getSessionId(this.req)});

		return {
			error: null,
			data: res,
			code: 200,
			headers: {
				"ZWAYSession": res.sid,
				"Set-Cookie": "ZWAYSession=" + res.sid + "; Path=/" // set cookie - it will duplicate header just in case client prefers cookies
			}
		};
	},
	// Check if login exists and password is correct
	verifyLogin: function() {
		var reqObj;

		try {
			reqObj = parseToObject(this.req.body);
		} catch (ex) {
			return {
				error: ex.message,
				data: null,
				code: 500,
				headers: null
			};
		}

		var profile = _.find(this.controller.profiles, function(profile) {
			return profile.login === reqObj.login;
		});

		if (profile) {
			// check if the pwd matches
			var pwd_check = reqObj.password ? (!profile.salt && profile.password === reqObj.password) || (profile.salt && profile.password === hashPassword(reqObj.password, profile.salt)) : false;

			if (pwd_check) {
				return this.setLogin(profile, this.req);
			} else {
				return this.denyLogin();
			}
		} else {
			return this.denyLogin();
		}
	},

	doLogout: function() {
		var reply = {
				error: null,
				data: null,
				code: 400,
				headers: null
			},
			self = this,
			session;

		reply.headers = {
			"Set-Cookie": "ZWAYSession=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT" // clean cookie
		};

		reply.code = 200;
			
		var sessionId = this.controller.auth.getSessionId(this.req);

		if (sessionId) {
			var session = {};
			var sessionProfile = _.find(this.controller.profiles, function(profile) {
				var sess = _.find(profile.authTokens, function(authToken) {
					return authToken.sid == sessionId;
				});
				if (sess) session = sess;
				return sess;
			});
			if (session.expire !== 0) {
				// do not logout from permanent tokens - they should be deleted explicitelly via remoteToken API call
				this.controller.removeToken(sessionProfile, session.sid);
			}
		}
		
		return reply;
	},
	// Devices
	listDevices: function() {
		var nowTS = Math.floor(Date.now() / 1000),
			reply = {
				error: null,
				data: {
					structureChanged: false,
					updateTime: nowTS,
					devices: []
				}
			},
			since = this.req.query.hasOwnProperty("since") ? parseInt(this.req.query.since, 10) : 0;

		reply.data.structureChanged = this.controller.lastStructureChangeTime >= since && since? true : false;
		reply.data.devices = this.controller.devicesByUser(this.req.user, function(dev) {
			return dev.get("updateTime") >= (reply.data.structureChanged ? 0 : since);
		});
		if (Boolean(this.req.query.pagination)) {
			reply.data.total_count = devices.length;
		}

		return reply;
	},
	getVDevFunc: function(vDevId) {
		var reply = {
				error: null,
				data: null
			},
			device = _.find(this.controller.devicesByUser(this.req.user), function(device) {
				return device.id === vDevId;
			});

		if (device) {
			reply.code = 200;
			reply.data = device.toJSON();
		} else {
			reply.code = 404;
			reply.error = "Device " + vDevId + " doesn't exist";
		}
		return reply;
	},
	setVDevFunc: function(vDevId) {
		var reqObj,
			device = null,
			reply = {
				error: null,
				data: null,
				code: 500,
			},
			result = false;

		try {
			reqObj = typeof this.req.body === 'string' ? JSON.parse(this.req.body) : this.req.body;
		} catch (ex) {
			reply.error = ex.message;
			return reply;
		}

		// check security hole here!!!!
		
		if (this.req.query.hasOwnProperty('icon')) {
			device = this.controller.devices.get(vDevId);
			if (device) {
				device.set('customIcons', reqObj.customicons, {
					silent: true
				});
				reply.data = "OK";
				result = true;
			}
		} else {
			device = this.controller.deviceByUser(vDevId, this.req.user);
			if (device) {
				reply.data = device.set(reqObj);
				result = true;
			}
		}

		if (result) {
			reply.code = 200;
		} else {
			reply.code = 404;
			reply.error = "Device " + vDevId + " doesn't exist";
		}
		return reply;
	},
	performVDevCommandFunc: function(vDevId, commandId) {
		var reply = {
				error: null,
				data: null,
				code: 200
			},
			result_execution_command,
			vDev = this.controller.deviceByUser(vDevId, this.req.user);

		if (vDev) {
			result_execution_command = vDev.performCommand.call(vDev, commandId, this.req.query);
			reply.data = !!result_execution_command ? result_execution_command : null;
		} else {
			reply.data = null;
			reply.code = 404;
			reply.error = "Device " + vDevId + " doesn't exist";
		}
		return reply;
	},
	getDeviceReference: function(vDevId) {
		var reply = {
				error: null,
				data: this.controller.findModulesReferencingDeviceId(vDevId),
				code: 200
			};

		return reply;
	},
	// Notifications
	exposeNotifications: function(notificationId) {
		var notifications,
			reply = {
				error: null,
				data: null,
				code: 200
			},
			timestamp = Date.now(),
			since = this.req.query.hasOwnProperty("since") ? parseInt(this.req.query.since, 10) : 0,
			to = (this.req.query.hasOwnProperty("to") ? parseInt(this.req.query.to, 10) : 0) || timestamp,
			profile = this.controller.profileByUser(this.req.user),
			devices = this.controller.devicesByUser(this.req.user).map(function(device) {
				return device.id;
			}),
			test = function(n) {
				return ((profile.hide_system_events === false && n.level !== 'device-info') || // hide_system_events = false
						(profile.hide_all_device_events === false && n.level === 'device-info')) && // hide_device_events = false
					(!profile.hide_single_device_events || profile.hide_single_device_events.indexOf(n.source) === -1) && // remove events from devices to hide
					((n.level !== 'device-info' && devices.indexOf(n.source) === -1) || (n.level === 'device-info' && devices.indexOf(n.source) > -1)); //  filter device by user
			};

		if (notificationId) {

			notification = this.controller.notifications.get().filter(function(notification) {
				return notification.id === notificationId && // filter by id
					test(notification); // check against 2nd filter
			});

			if (notification.length > 0) {
				reply.data = notification[0];
			} else {
				reply.code = 404;
				reply.error = 'Not found';
			}

		} else {
			notifications = this.controller.notifications.get().filter(function(notification) {
				return notification.id >= since && notification.id <= to && // filter by time
					test(notification); // check against 2nd filter
			});

			reply.data = {
				updateTime: Math.floor(timestamp / 1000),
				notifications: notifications
			};
		}

		if (Boolean(this.req.query.pagination)) {
			reply.data.total_count = notifications.length;
			// !!! fix pagination
			notifications = notifications.slice();
		}

		return reply;
	},
	// delete single notifications or all privious by a choosen timestamp
	deleteNotifications: function(notificationId) {

		var id = notificationId ? parseInt(notificationId) : 0,
			reply = {
				code: 500,
				data: null,
				error: "Something went wrong."
			},
			before;

		before = this.req.query.hasOwnProperty("allPrevious") ? Boolean(this.req.query.allPrevious) : false;
		redeemed = this.req.query.hasOwnProperty("allRedeemed") ? Boolean(this.req.query.allRedeemed) : false;

		if (!redeemed) {
			this.controller.deleteNotifications(id, before, function(notice) {
				if (notice) {
					reply.code = 204;
					reply.data = null;
					reply.error = null;
				} else {
					reply.code = 404;
					reply.data = null;
					reply.error = "Notifications not found.";
				}
			});
		} else {
			this.controller.deleteAllRedeemedNotifications(function(notice) {
				if (notice) {
					reply.code = 204;
					reply.data = null;
					reply.error = null;
				}
			});
		}

		return reply;
	},
	// redeem single or all notifications (true/false)
	redeemNotifications: function(notificationId) {

		var id = notificationId ? parseInt(notificationId) : 0,
			reply = {
				code: 500,
				data: null,
				error: "Something went wrong."
			};

		redeemed = this.req.body.hasOwnProperty("set_redeemed") ? retBoolean(this.req.body.set_redeemed) : false;
		all = this.req.body.hasOwnProperty("all") ? retBoolean(this.req.body.all) : false;

		if (!all) {
			this.controller.redeemNotification(id, redeemed, function(notice) {
				if (notice) {
					reply.code = 204;
					reply.data = null;
					reply.error = null;
				} else {
					reply.code = 404;
					reply.data = null;
					reply.error = 'Notification not found.';
				}
			});
		} else {
			this.controller.redeemAllNotifications(redeemed, function(notice) {
				if (notice) {
					reply.code = 204;
					reply.data = null;
					reply.error = null;
				}
			});
		}

		return reply;
	},
	//locations
	listLocations: function() {
		var reply = {
				data: null,
				error: null
			},
			locations = this.controller.locationsByUser(this.req.user),
			expLocations = [];

		// generate namespaces per location
		reply.code = 200;
		reply.data = locations;

		return reply;
	},
	// get location
	getLocationFunc: function(locationId) {
		var reply = {
				data: null,
				error: null
			},
			locations = this.controller.locationsByUser(this.req.user),
			_location = [],
			locationId = !isNaN(locationId) ? parseInt(locationId, 10) : locationId;

		_location = this.controller.getLocation(locations, locationId);

		// generate namespaces for location
		if (_location) {
			reply.data = _location;
			reply.code = 200;
		} else {
			reply.code = 404;
			reply.error = "Location " + locationId + " not found";
		}

		return reply;
	},
	//filter location namespaces
	getLocationNamespacesFunc: function(locationId, namespaceId) {
		var reply = {
				data: null,
				error: null
			},
			locations = this.controller.locationsByUser(this.req.user),
			_location = [],
			locationId = !isNaN(locationId) ? parseInt(locationId, 10) : locationId;

		_location = this.controller.getLocation(locations, locationId);

		// generate namespaces for location and get its namespaces
		if (_location) {

			// get namespaces by path (namespaceId)
			if (!namespaceId) {
				getFilteredNspc = _location.namespaces;
			} else {
				getFilteredNspc = this.controller.getListNamespaces(namespaceId, _location.namespaces);
			}

			if (!getFilteredNspc || (_.isArray(getFilteredNspc) && getFilteredNspc.length < 1)) {
				reply.code = 404;
				reply.error = "Couldn't find namespaces entry with: '" + namespaceId + "'";
			} else {
				reply.data = getFilteredNspc;
				reply.code = 200;
			}
		} else {
			reply.code = 404;
			reply.error = "Location " + locationId === 0 ? 'globalRoom' : locationId + " not found";
		}

		return reply;
	},
	addLocation: function() {
		var title,
			reply = {
				error: null,
				data: null
			},
			reqObj,
			locProps = {};

		if (this.req.method === 'GET') {

			reqObj = this.req.query;

		} else if (this.req.method === 'POST') { // POST
			try {
				reqObj = JSON.parse(this.req.body);
			} catch (ex) {
				reply.code = 500;
				reply.error = "Cannot parse POST request. ERROR:" + ex.message;
			}
		}

		for (var property in reqObj) {
			if (property !== 'id') {
				locProps[property] = reqObj[property] ? reqObj[property] : null;
			}
		}

		if (!!locProps.title) {
			this.controller.addLocation(locProps, function(data) {
				if (data) {
					reply.code = 201;
					reply.data = data;
				} else {
					reply.code = 500;
					reply.error = "Location doesn't created: Parsing the arguments has failed.";
				}
			});
		} else {
			reply.code = 500;
			reply.error = "Argument 'title' is required.";
		}

		return reply;
	},
	removeLocation: function(locationId) {
		var id,
			reqObj,
			reply = {
				error: null,
				data: null,
				code: 200
			};

		if (this.req.method === 'GET') {
			id = parseInt(this.req.query.id);
		} else if (this.req.method === 'DELETE' && locationId === undefined) {
			try {
				reqObj = JSON.parse(this.req.body);
			} catch (ex) {
				reply.error = ex.message;
			}
			id = reqObj.id;
		} else if (this.req.method === 'DELETE' && locationId !== undefined) {
			id = locationId;
		}

		if (!!id) {
			if (id !== 0) {
				this.controller.removeLocation(id, function(result) {
					if (result) {
						reply.code = 204;
						reply.data = null;
					} else {
						reply.code = 404;
						reply.error = "Location " + id + " doesn't exist";
					}
				});
			} else {
				reply.code = 403;
				reply.error = "Permission denied";
			}
		} else {
			reply.code = 400;
			reply.error = "Argument id is required";
		}

		return reply;
	},
	removeLocationImage: function(locationId) {
		var id,
			user_img,
			reqObj,
			reply = {
				error: null,
				data: null,
				code: 200
			};

		if (this.req.method === 'DELETE' && locationId === undefined) {
			try {
				reqObj = JSON.parse(this.req.body);
			} catch (ex) {
				reply.error = ex.message;
			}
			id = reqObj.id;
			user_img = reqObj.user_img;

		} else if (this.req.method === 'DELETE' && locationId !== undefined) {
			id = locationId;
			user_img = this.req.query.user_img;
		}

		if (!!id || user_img !== "") {
			if (id !== 0) {
				var location = this.controller.getLocation(this.controller.locations, id);
				if (location) {
					// check custom image exists
					if (!loadObject(user_img)) {
						reply.code = 404;
						reply.error = "Location image " + user_img + " doesn't exist or already deleted.";
					} else {
						// delete custom room image
						saveObject(user_img, null, true);
						if (location.user_img == user_img && location.img_type == 'user') {
							location.user_img = '';
							location.img_type = '';
							location.show_background = false;
						} else if (location.user_img == user_img) {
							location.user_img = '';
						}
						// update affected location
						this.controller.updateLocation(location.id, location.title, location.user_img, location.default_img, location.img_type, location.show_background, location.main_sensors, function(data) {
							if (data) {
								reply.data = data;
							} else {
								reply.code = 404;
								reply.error = "Location " + id + " doesn't exist.";
							}
						});
					}
				} else {
					reply.code = 404;
					reply.error = "Location " + id + " doesn't exist.";
				}
			} else {
				reply.code = 403;
				reply.error = "Permission denied.";
			}
		} else {
			reply.code = 400;
			reply.error = "Argument id, user_img is required.";
		}

		return reply;
	},
	updateLocation: function(locationId) {
		var id,
			title,
			user_img,
			default_img,
			img_type,
			show_background,
			main_sensors,
			reply = {
				error: null,
				data: null,
				code: 200
			},
			reqObj;

		if (locationId !== 0) {
			if (this.req.method === 'GET') {
				id = parseInt(this.req.query.id);
				title = this.req.query.title;
			} else if (this.req.method === 'PUT') {
				try {
					reqObj = JSON.parse(this.req.body);
				} catch (ex) {
					reply.error = ex.message;
				}
				id = locationId || reqObj.id;
				title = reqObj.title;
				user_img = reqObj.user_img || '';
				default_img = reqObj.default_img || '';
				img_type = reqObj.img_type || '';
				show_background = reqObj.show_background || false;
				main_sensors = reqObj.main_sensors || [];
			}

			if (!!title && title.length > 0) {
				this.controller.updateLocation(id, title, user_img, default_img, img_type, show_background, main_sensors, function(data) {
					if (data) {
						reply.data = data;
					} else {
						reply.code = 404;
						reply.error = "Location " + id + " doesn't exist";
					}
				});
			} else {
				reply.code = 400;
				reply.error = "Arguments id & title are required";
			}
		} else {
			reply.code = 403;
			reply.error = "Permission denied.";
		}


		return reply;
	},
	// modules
	listModules: function() {
		var reply = {
				error: null,
				data: [],
				code: 200
			},
			module = null;

		Object.keys(this.controller.modules).sort().forEach(function(className) {
			module = this.controller.getModuleData(className);
			module.className = className;

			if (module.location === ('userModules/' + className) && fs.list('modules/' + className)) {
				module.hasReset = true;
			} else {
				module.hasReset = false;
			}

			if (module.singleton && _.any(this.controller.instances, function(instance) {
					return instance.moduleId === module.id;
				})) {
				module.created = true;
			} else {
				module.created = false;
			}
			reply.data.push(module);
		});

		return reply;
	},
	getModuleFunc: function(moduleId) {
		var reply = {
				error: null,
				data: null,
				code: null
			},
			moduleData;

		if (!this.controller.modules.hasOwnProperty(moduleId)) {
			reply.code = 404;
			reply.error = 'Instance ' + moduleId + ' not found';
		} else {
			// get module data
			moduleData = this.controller.getModuleData(moduleId);

			if (moduleData.location === ('userModules/' + moduleId) && fs.list('modules/' + moduleId)) {
				moduleData.hasReset = true;
			} else {
				moduleData.hasReset = false;
			}

			reply.code = 200;
			// replace namspace filters
			reply.data = this.controller.replaceNamespaceFilters(moduleData);
		}

		return reply;
	},
	// modules categories
	listModulesCategories: function() {
		var reply = {
			error: null,
			data: null,
			code: 200
		};

		reply.data = this.controller.getListModulesCategories();

		return reply;
	},
	getModuleCategoryFunc: function(categoryId) {
		var reply = {
			error: null,
			data: null,
			code: 500
		};

		category = this.controller.getListModulesCategories(categoryId);

		if (!Boolean(category)) {
			reply.code = 404;
			reply.error = "Categories " + categoryId + " not found";
		} else {
			reply.code = 200;
			reply.data = category;
		}

		return reply;
	},
	transformModule: function() {
		var reply = {
				error: 'Something went wrong.',
				data: null,
				code: 500
			},
			reqObj = parseToObject(this.req.body),
			sources = ['IfThen', 'LogicalRules', 'ScheduledScene', 'LightScene'],
			targets = ['Rules', 'Schedules', 'Scenes'],
			source = reqObj.source && ['IfThen', 'LogicalRules', 'ScheduledScene', 'LightScene'].indexOf(reqObj.source) > -1 ? reqObj.source : null,
			target = reqObj.target && ['Rules', 'Schedules', 'Scenes'].indexOf(reqObj.target) > -1 ? reqObj.target : null,
			pairing = false,
			resultList = [];

		try {
			pairing = (target === 'Rules' && (source === 'IfThen' || source === 'LogicalRules')) ||
				(target === 'Schedules' && source === 'ScheduledScene') ||
				(target === 'Scenes' && source === 'LightScene');

			if (pairing) {
				resultList = this.controller.transformIntoNewInstance(source);

				reply.code = 200;
				reply.data = resultList;
				reply.error = null;
			} else {
				reply.code = 400;
				reply.error = 'Bad Request. Following transformations are allowed: IfThen/LogicalRules > Rules, ScheduledScene > Schedules, LightScene > Scenes';
			}

		} catch (e) {
			reply.error += ' Error: ' + e.toString();
		}

		return reply;
	},
	revertTransformModuleFlag: function() {
		var self = this,
			reply = {
				error: 'Something went wrong.',
				data: null,
				code: 500
			},
			transformationsDone = false;

		try {

			_.forEach(this.controller.instances, function(instance) {
				if (instance.params.moduleAPITransformed) {
					// remove transformed flag
					delete instance.params.moduleAPITransformed;
					self.controller.reconfigureInstance(instance.id, instance);
					transformationsDone = true;
				}
			});

			reply.code = 200;
			reply.data = transformationsDone ? 'successfull' : 'No transformations found.';
			reply.error = null;

		} catch (e) {
			reply.error += ' Error: ' + e.toString();
		}

		return reply;
	},
	// install module
	installModule: function() {
		var reply = {
				error: {
					key: null,
					errorMsg: null
				},
				data: {
					key: null,
					appendix: null
				},
				code: 500
			},
			moduleUrl = parseToObject(this.req.body).moduleUrl,
			result = "",
			moduleId = moduleUrl.split(/[\/]+/).pop().split(/[.]+/).shift();

		if (!this.controller.modules[moduleId]) {

			// download and install the module
			result = this.controller.installModule(moduleUrl, moduleId);

			if (result === "done") {

				loadSuccessfully = this.controller.loadInstalledModule(moduleId, 'userModules/', false);

				if (loadSuccessfully) {
					reply.code = 201;
					reply.data.key = "app_installation_successful"; // send language key as response
				} else {
					reply.code = 201;
					reply.data.key = "app_installation_successful_but_restart_necessary"; // send language key as response
				}

			} else {
				reply.code = 500;
				reply.error.key = 'app_failed_to_install';
			}
		} else {
			reply.code = 409;
			reply.error.key = 'app_from_url_already_exist';
		}
		return reply;
	},
	updateModule: function() {
		var reply = {
				error: {
					key: null,
					errorMsg: null
				},
				data: {
					key: null,
					appendix: null
				},
				code: 500
			},
			moduleUrl = parseToObject(this.req.body).moduleUrl,
			result = "",
			moduleId = moduleUrl.split(/[\/]+/).pop().split(/[.]+/).shift();

		if (this.controller.modules[moduleId]) {

			// download and install/overwrite the module
			result = this.controller.installModule(moduleUrl, moduleId);

			if (result === "done") {

				loadSuccessfully = this.controller.reinitializeModule(moduleId, 'userModules/');

				if (loadSuccessfully) {
					reply.code = 200;
					reply.data.key = "app_update_successful"; // send language key as response
				} else {
					reply.code = 200;
					reply.data.key = "app_update_successful_but_restart_necessary"; // send language key as response
				}

			} else {
				reply.code = 500;
				reply.error.key = 'app_failed_to_update';
			}
		} else {
			reply.code = 404;
			reply.error.key = 'app_from_url_not_exist';
		}
		return reply;
	},
	deleteModule: function(moduleId) {
		var reply = {
				error: {
					key: null
				},
				data: {
					key: null,
					appendix: null
				},
				code: 500
			},
			uninstall = false;

		if (this.controller.modules[moduleId]) {

			uninstall = this.controller.uninstallModule(moduleId);

			if (uninstall) {
				reply.code = 200;
				reply.data.key = "app_delete_successful"; // send language key as response
			} else {
				reply.code = 500;
				reply.error.key = 'app_failed_to_delete';
			}
		} else {
			reply.code = 404;
			reply.error.key = 'app_not_exist';
		}
		return reply;
	},
	resetModule: function(moduleId) {
		var reply = {
				error: {},
				data: {},
				code: 500
			},
			unload;

		var result = "in progress";

		if (this.controller.modules[moduleId]) {

			if (this.controller.modules[moduleId].location === ('userModules/' + moduleId) && fs.list('modules/' + moduleId)) {

				uninstall = this.controller.uninstallModule(moduleId, true);

				if (uninstall) {
					reply.code = 200;
					reply.data.key = 'app_reset_successful_to_version';
					reply.data.appendix = this.controller.modules[moduleId].meta.version;
				} else {
					reply.code = 500;
					reply.error = 'There was an error during resetting the app ' + moduleId + '. Maybe a server restart could solve this problem.';
				}
			} else {
				reply.code = 412;
				reply.error.key = 'app_is_still_reseted';
			}
		} else {
			reply.code = 404;
			reply.error.key = 'app_not_exist';
		}
		return reply;
	},
	getModuleTokens: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			tokenObj = {
				tokens: []
			},
			getTokens = function() {
				return loadObject('moduleTokens.json');
			};

		if (getTokens() === null) {
			saveObject('moduleTokens.json', tokenObj, true);
		}

		if (!!getTokens()) {
			reply.data = getTokens();
			reply.code = 200;
		} else {
			reply.error = 'failed_to_load_tokens';
		}

		return reply;
	},
	storeModuleToken: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			reqObj = parseToObject(this.req.body),
			tokenObj = loadObject('moduleTokens.json');

		if (tokenObj === null) {
			saveObject('moduleTokens.json', tokenObj, true);

			// try to load it again
			tokenObj = loadObject('moduleTokens.json');
		}

		if (reqObj && reqObj.token && !!tokenObj && tokenObj.tokens) {
			if (tokenObj.tokens.indexOf(reqObj.token) < 0) {
				// add new token id
				tokenObj.tokens.push(reqObj.token);

				// save tokens
				saveObject('moduleTokens.json', tokenObj, true);

				reply.data = tokenObj;
				reply.code = 201;
			} else {
				reply.code = 409;
				reply.error = 'token_not_unique';
			}
		} else {
			reply.error = 'failed_to_load_tokens';
		}

		return reply;
	},
	deleteModuleToken: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			reqObj = parseToObject(this.req.body),
			tokenObj = loadObject('moduleTokens.json');

		if (reqObj && reqObj.token && !!tokenObj && tokenObj.tokens) {
			if (tokenObj.tokens.indexOf(reqObj.token) > -1) {
				// add new token id
				tokenObj.tokens = _.filter(tokenObj.tokens, function(token) {
					return token !== reqObj.token;
				});

				// save tokens
				saveObject('moduleTokens.json', tokenObj, true);

				reply.data = tokenObj;
				reply.code = 200;
			} else {
				reply.code = 404;
				reply.error = 'not_existing_token';
			}
		} else {
			reply.error = 'failed_to_load_tokens';
		}

		return reply;
	},
	// reinitialize modules
	reinitializeModule: function(moduleId) {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			location = [],
			loadSuccessfully = 0;

		if (fs.list('modules/' + moduleId)) {
			location.push('modules/');
		}

		if (fs.list('userModules/' + moduleId)) {
			location.push('userModules/');
		}

		if (location.length > 0) {
			try {

				_.forEach(location, function(loc) {
					loadSuccessfully += this.controller.reinitializeModule(moduleId, loc);
				});

				if (loadSuccessfully > 0) {
					reply.data = 'Reinitialization of app "' + moduleId + '" successfull.';
					reply.code = 200;
				}
			} catch (e) {
				reply.error = e.toString();
			}
		} else {
			reply.code = 404;
			reply.error = "App not found.";
		}

		return reply;
	},
	// instances
	listInstances: function() {
		var reply = {
				error: null,
				data: null,
				code: 200
			},
			instances = this.controller.listInstances();
		if (instances) {
			reply.data = instances;
		} else {
			reply.code = 500;
			reply.error = 'Could not list Instances.';
		}


		return reply;
	},
	createInstance: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			reqObj = this.req.reqObj,
			instance;

		if (this.controller.modules.hasOwnProperty(reqObj.moduleId)) {
			instance = this.controller.createInstance(reqObj);
			if (!!instance && instance) {
				reply.code = 201;
				reply.data = instance;
			} else {
				reply.code = 500;
				reply.error = "Cannot instantiate module " + reqObj.moduleId;
			}
		} else {
			reply.code = 404;
			reply.error = "Module " + reqObj.moduleId + " doesn't exist";
		}

		return reply;
	},
	getInstanceFunc: function(instanceId) {
		var reply = {
			error: null,
			data: null,
			code: 500
		};

		if (isNaN(instanceId)) {
			instance = _.filter(this.controller.instances, function(i) {
				return instanceId === i.moduleId;
			});
		} else {
			instance = _.find(this.controller.instances, function(i) {
				return parseInt(instanceId) === i.id;
			});
		}

		if (!Boolean(instance) || instance.length === 0) {
			reply.code = 404;
			reply.error = "Instance " + instanceId + " is not found";
		} else {
			reply.code = 200;
			reply.data = instance;
		}

		return reply;
	},
	reconfigureInstanceFunc: function(instanceId) {
		var reply = {
				error: null,
				data: null
			},
			reqObj = this.req.reqObj,
			instance;

		if (!_.any(this.controller.instances, function(instance) {
				return instanceId === instance.id;
			})) {
			reply.code = 404;
			reply.error = "Instance " + instanceId + " doesn't exist";
		} else {
			instance = this.controller.reconfigureInstance(instanceId, reqObj);
			if (instance) {
				reply.code = 200;
				reply.data = instance;
			} else {
				reply.code = 500;
				reply.error = "Cannot reconfigure module " + instanceId + " config";
			}
		}

		return reply;
	},
	deleteInstanceFunc: function(instanceId) {
		var reply = {
			error: null,
			data: null,
			code: 200
		};

		if (!_.any(this.controller.instances, function(instance) {
				return instance.id === instanceId;
			})) {
			reply.code = 404;
			reply.error = "Instance " + instanceId + " not found";
		} else {
			reply.code = 204;
			reply.data = null;
			this.controller.deleteInstance(instanceId);
		}

		return reply;
	},
	// profiles
	listProfiles: function(profileId) {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			profiles,
			getProfile,
			excl = [];

		// list all profiles only if user has 'admin' permissions
		if (!_.isNumber(profileId)) {
			if (this.req.role === this.ROLE.ADMIN) {
				profiles = this.controller.getListProfiles();
			} else {
				getProfile = this.controller.safeProfile(this.controller.getProfile(this.req.user), ["role", "authTokens"]);
				if (getProfile) {
					profiles = [getProfile];
				}
			}
			if (!Array.isArray(profiles)) {
				reply.code = 500;
				reply.error = "Unknown error";
			} else {
				reply.code = 200;
				reply.data = profiles;
			}
		} else {
			getProfile = this.controller.getProfile(profileId);
			if (!!getProfile && (this.req.role === this.ROLE.ADMIN || (this.req.role === this.ROLE.USER && this.req.user === getProfile.id))) {

				// do not send password (also role if user is not admin)
				if (this.req.role === this.ROLE.ADMIN) {
					excl = [];
				} else {
					excl = ["role"];
				}

				reply.code = 200;
				reply.data = this.controller.safeProfile(getProfile);
			} else {
				reply.code = 404;
				reply.error = "Profile not found.";
			}
		}

		return reply;
	},
	createProfile: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			reqObj,
			profile,
			uniqueEmail = [],
			uniqueLogin = [];

		try {
			reqObj = JSON.parse(this.req.body);
		} catch (ex) {
			reply.error = ex.message;
			return reply;
		}

		uniqueEmail = _.filter(this.controller.profiles, function(p) {
			return p.email !== '' && p.email === reqObj.email;
		});

		uniqueLogin = _.filter(this.controller.profiles, function(p) {
			return p.login !== '' && p.login === reqObj.login;
		});

		if (uniqueEmail.length > 0) {
			reply.code = 409;
			reply.error = 'nonunique_email';
		} else if (uniqueLogin.length > 0) {
			reply.code = 409;
			reply.error = 'nonunique_user';
		} else {
			_.defaults(reqObj, {
				role: null,
				name: 'User',
				email: '',
				lang: 'en',
				dashboard: [],
				interval: 2000,
				rooms: reqObj.role === this.ROLE.ADMIN ? [0] : [],
				devices: [],
				expert_view: false,
				hide_all_device_events: false,
				hide_system_events: false,
				hide_single_device_events: [],
				skin: ''
			});

			// skip OAuth2 and other metadata
			reqObj = _.omit(reqObj, 'passwordConfirm', 'client_id', 'response_type', 'redirect_uri');

			profile = this.controller.createProfile(reqObj);
			if (profile !== undefined && profile.id !== undefined) {
				reply.data = this.controller.safeProfile(profile);
				reply.code = 201;
			} else {
				reply.code = 500;
				reply.error = "Profile creation error";
			}
		}

		return reply;
	},
	createOAuth2Profile: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			reqObj,
			profile,
			profileReply,
			zbwToken,
			sid,
			oauthReply,
			authToken,
			clientId;
		
		// check that find.z-wave.me token is present
		if (this.req.headers['Cookie']) {
			var zbwCookie = this.req.headers['Cookie'].split(";").map(function(el) { return el.trim().split("="); }).filter(function(el) { return el[0] === "ZBW_SESSID" })[0];
			if (zbwCookie) zbwToken = zbwCookie[1];
		}
		if (!zbwToken) {
			reply.code = 405;
			reply.error = "This method must be called thru find.z-wave.me";
			return reply;
		}
		
		try {
			reqObj = JSON.parse(this.req.body);
			clientId = reqObj.client_id;
			redirectUri = reqObj.redirect_uri;
			responseType = reqObj.response_type;
		} catch (ex) {
			reply.code = 500;
			reply.error = ex.message;
			return reply;
		}
		
		profileReply = this.createProfile();
		
		if (profileReply.code !== 200 && profileReply.code !== 201) return profileReply;
		
		// profileReply.data is a safe copy, so get the original profile for checkIn
		profile = _.find(this.controller.profiles, function (_profile) {
			return _profile.id == profileReply.data.id;
		});
		
		// create permanent auth token for this user
		sid = this.controller.auth.checkIn(profile, this.req, true);
		data = {
			access_token: zbwToken + "/" + sid,
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: responseType
		}
		oauthReply = http.request({
			url: "https://oauth2.z-wave.me:5000/saveToken",
			method: "POST",
			async: false,
			headers: {
				'Content-Type':'application/json'
			},
			data: JSON.stringify(data)
		});
		if (oauthReply.status != 200) {
			this.removeProfile(profile.id); // revert creation of the user
			reply.code = oauthReply.status;
			reply.error = oauthReply.statusText;
			return reply
		}
		authCode = oauthReply.data.auth_code;
		if (!authCode) {
			this.removeProfile(profile.id); // revert creation of the user
			reply.code = 500;
			reply.error = "OAuth2 auth token is empty";
			return reply
		}
		
		reply.code = 200;
		reply.data = {
			auth_code: authCode
		};
		return reply;
	},
	updateProfile: function(profileId) {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			reqObj,
			profile = _.clone(this.controller.getProfile(profileId)), // clone to allow check changes in controller.updateProfile
			uniqueProfProps = [];

		if (profile && (this.req.role === this.ROLE.ADMIN || (this.req.role === this.ROLE.USER && this.req.user === profile.id))) {
			reqObj = JSON.parse(this.req.body);

			if (profile.id === this.req.user && profile.role === this.ROLE.ADMIN && reqObj.role !== this.ROLE.ADMIN) {
				reply.code = 403;
				reply.error = "Revoking self Admin priviledge is not allowed.";
			} else {
				// check that e-mail is unique or empty
				uniqueProfProps = _.filter(this.controller.profiles, function(p) {
					return (p.email !== '' && p.email === reqObj.email) &&
						p.id !== profileId;
				});

				if (uniqueProfProps.length === 0) {
					// only Admin can change critical parameters
					if (this.req.role === this.ROLE.ADMIN) {
						// id is never changeable
						// login is changed by updateProfileAuth()
						profile.role = reqObj.role;
						profile.rooms = reqObj.rooms.indexOf(0) === -1 && reqObj.role === this.ROLE.ADMIN ? reqObj.rooms.push(0) : reqObj.rooms;
						profile.devices = reqObj.devices || [];
						profile.expert_view = reqObj.expert_view;
						profile.beta = reqObj.beta;
					}
					// could be changed by user role
					profile.name = reqObj.name; // profile name
					profile.interval = reqObj.interval; // update interval from ui
					profile.hide_system_events = reqObj.hide_system_events;
					profile.hide_all_device_events = reqObj.hide_all_device_events;
					profile.lang = reqObj.lang;
					profile.dashboard = reqObj.dashboard;
					profile.hide_single_device_events = reqObj.hide_single_device_events;
					profile.email = reqObj.email;
					profile.night_mode = reqObj.night_mode;

					profile = this.controller.updateProfile(profile, profile.id);

					if (profile !== undefined && profile.id !== undefined) {
						reply.data = this.controller.safeProfile(profile);
						reply.code = 200;
					} else {
						reply.code = 500;
						reply.error = "Profile was not created";
					}
				} else {
					reply.code = 409;
					reply.error = 'nonunique_email';
				}
			}
		} else {
			reply.code = 404;
			reply.error = "Profile not found.";
		}

		return reply;
	},
	// different pipe for updating authentication values
	updateProfileAuth: function(profileId) {
		var self = this,
			reply = {
				error: null,
				data: null,
				code: 500
			},
			reqObj,
			profile = this.controller.getProfile(profileId),
			uniqueLogin = [],
			reqToken = this.req.reqObj.hasOwnProperty("token") ? this.req.reqObj.token : null,
			tokenObj = {};

		reqObj = JSON.parse(this.req.body);

		if (profile && (this.req.role === this.ROLE.ADMIN || (this.req.role === this.ROLE.USER && this.req.user === profile.id))) {

			uniqueLogin = _.filter(this.controller.profiles, function(p) {
				if (self.req.role === self.ROLE.ADMIN && self.req.user !== parseInt(reqObj.id, 10)) {
					return p.login !== '' && p.login === reqObj.login && p.id !== parseInt(reqObj.id, 10);
				} else {
					return p.login !== '' && p.login === reqObj.login && p.id !== self.req.user;
				}
			});

			if (uniqueLogin.length < 1) {
				profile = this.controller.updateProfileAuth(reqObj, profileId);

				if (!!profile && profile.id !== undefined) {
					reply.data = this.controller.safeProfile(profile);
					reply.code = 200;
				} else {
					reply.code = 500;
					reply.error = "Was not able to update password.";
				}
			} else {
				reply.code = 409;
				reply.error = 'nonunique_user';
			}
		} else if (this.req.role === this.ROLE.ANONYMOUS && profileId && !!reqToken) {
			tokenObj = self.controller.auth.getForgottenPwdToken(reqToken);

			if (tokenObj && !!tokenObj) {
				profile = this.controller.updateProfileAuth(reqObj, profileId);

				if (!!profile && profile.id !== undefined) {
					// remove forgotten token
					self.controller.auth.removeForgottenPwdEntry(reqToken);

					reply.code = 200;
				} else {
					reply.code = 500;
					reply.error = "Was not able to update password.";
				}
			} else {
				reply.code = 404;
				reply.error = "Token not found.";
			}
		} else {
			reply.code = 403;
			reply.error = "Forbidden.";
		}

		return reply;
	},
	restorePassword: function(profileId) {
		var self = this,
			reply = {
				error: null,
				data: null,
				code: 500
			},
			reqObj = typeof this.req.body !== 'object' ? JSON.parse(this.req.body) : this.req.body,
			reqToken = this.req.query.hasOwnProperty("token") ? this.req.query.token : null,
			profile,
			emailExists = [],
			tokenObj;

		if (reqObj.email) {
			emailExists = _.filter(self.controller.profiles, function(profile) {
				return profile.email !== '' && profile.email === reqObj.email;
			});
		}

		if (reqToken === null && emailExists.length > 0 && !profileId) {

			try {
				var tkn = crypto.guid(),
					success = self.controller.auth.forgottenPwd(reqObj.email, tkn);

				if (success) {
					reply.data = {
						token: tkn
					};
					reply.code = 200;
				} else {
					reply.error = "Token request for e-mail already exists.";
					reply.code = 409;
				}

			} catch (e) {
				reply.code = 500;
				reply.error = "Internal server error.";
			}
		} else if (!!reqToken && emailExists.length < 1 && !profileId) {
			try {
				tokenObj = self.controller.auth.getForgottenPwdToken(reqToken);

				if (tokenObj && !!tokenObj) {

					profile = _.filter(self.controller.profiles, function(p) {
						return p.email === tokenObj.email;
					});

					if (profile[0]) {
						reply.code = 200;
						reply.data = {
							userId: profile[0].id
						};
					} else {
						reply.code = 404;
						reply.error = "User not found.";
					}
				} else {
					reply.code = 404;
					reply.error = "Token not found.";
				}
			} catch (e) {
				reply.code = 500;
				reply.error = "Internal server error.";
			}
		} else if (!!reqToken && emailExists.length < 1 && profileId) {

			profile = self.controller.updateProfileAuth(reqObj, profileId);

			if (!!profile && profile.id !== undefined) {
				reply.code = 200;
			} else {
				reply.code = 500;
				reply.error = "Wasn't able to update password.";
			}
		} else {
			reply.code = 404;
			reply.error = "Email not found.";
		}

		return reply;
	},
	removeProfile: function(profileId) {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			profile = this.controller.getProfile(profileId);

		if (profile) {
			// It is not possible to delete own profile
			if (profile.id !== this.req.user) {
				this.controller.removeProfile(profileId);
				reply.data = null;
				reply.code = 204;
			} else {
				reply.code = 403;
				reply.error = "Deleting own profile is not allowed.";
			}
		} else {
			reply.code = 404;
			reply.error = "Profile not found";
		}

		return reply;
	},
	removeOwnProfile: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			profile = this.controller.getProfile(this.req.user);
		if (profile) {
			// It is possible to delete own profile if the role is USER
			if (this.req.role === profile.role) {
				if (profile.authTokens.length == 1) {
					// remove full profile
					this.controller.removeProfile(this.req.user);
					reply.data = null;
					reply.code = 204;
				} else if (profile.authTokens.length > 1) {
					// remove single token
					this.controller.removeToken(profile, this.req.token)
					reply.data = null;
					reply.code = 204;
				} else {
					reply.code = 404;
					reply.error = "No tokens found - how have you logged in?";
				}
			} else {
				reply.code = 403;
				reply.error = "Deleting is possible only for own user profile.";
			}
		} else {
			reply.code = 404;
			reply.error = "Profile not found";
		}
		return reply;
	},
	removeToken: function(profileId, token) {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			profile = this.controller.getProfile(profileId);

		if (profile) {
			// Manage own tokens for users or any token for admin
			if (profile.id === this.req.user && this.req.role === this.ROLE.USER || this.req.role === this.ROLE.ADMIN) {
				if (this.controller.removeToken(profile, token)) {
					reply.data = null;
					reply.code = 204;
				} else {
					reply.code = 404;
					reply.error = "Token not found";
				}
			} else {
				reply.code = 403;
				reply.error = "Permission denied";
			}
		} else {
			reply.code = 404;
			reply.error = "Profile not found";
		}

		return reply;
	},
	permanentToken: function(profileId, token) {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			profile = this.controller.getProfile(profileId);

		if (profile) {
			// Manage own tokens for users or any token for admin
			if (profile.id === this.req.user && this.req.role === this.ROLE.USER || this.req.role === this.ROLE.ADMIN) {
				if (this.controller.permanentToken(profile, token)) {
					reply.data = null;
					reply.code = 204;
				} else {
					reply.code = 404;
					reply.error = "Token not found";
				}
			} else {
				reply.code = 403;
				reply.error = "Permission denied";
			}
		} else {
			reply.code = 404;
			reply.error = "Profile not found";
		}

		return reply;
	},
	getQRCodeString: function(profileId) {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			profile = this.controller.getProfile(profileId);

		try {
			var reqObj = parseToObject(this.req.body);
		} catch (e) {
			return reply.error = e.message;
		}

		if (profile) {
			if (this.req.role === this.ROLE.ADMIN || (this.req.role === this.ROLE.USER && this.req.user === profileId)) {
				var pwd_check = reqObj.password ? (!profile.salt && profile.password === reqObj.password) || (profile.salt && profile.password === hashPassword(reqObj.password, profile.salt)) : false;
				if (pwd_check) {
					var qrcode_str = this.controller.getQRCodeData(profile, reqObj.password);

					if (qrcode_str !== undefined) {
						reply.code = 200;
						reply.data = qrcode_str;
					} else {
						reply.code = 500;
					}
				} else {
					reply.error = "wrong_password";
					reply.code = 500;
				}
			} else {
				reply.error = "Forbidden";
				reply.code = 403;
			}
		} else {
			reply.code = 404;
			reply.error = "Profile not found";
		}

		return reply;
	},
	/* Generating a local access token for the user. */
	generateLocalAccessToken: function (profileId) {
		var reply = {
			error: null,
			data: null,
			code: 500
		};
		var profile = _.find(this.controller.profiles, function (_profile) {
			return _profile.id === profileId;
		});
		if (profile) {
			var sid = this.controller.auth.checkIn(profile, this.req, true);
			var remoteId = this.controller.getRemoteId();
			reply.code = 200;
			reply.data =  {
				token: sid,
				remoteId: remoteId
			}
		} else {
			reply.code = 404;
			reply.error = "Profile not found";
		}
		return reply;
	},
	notificationFilteringGet: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
		    self = this;
		
		var userDevices = this.controller.devicesByUser(this.req.user).map(function(dev) { return dev.id; });
		var nfInstance = this.controller.listInstances().filter(function(i) { return i.moduleId === "NotificationFiltering"})[0]; // dirty hack - think about exported function by NotificationFiltering app
		
		if (nfInstance) {
			var devsStruct = [];
			var arr = nfInstance.params.rules.filter(function(rule) {
				var channel = self.controller.getNotificationChannel(rule.channel);
				return false || 
				   (rule.recipient_type === "user" && rule.user == self.req.user) || // non-strict == because might be as string in module params
				   (rule.recipient_type === "channel" && channel && channel.user == self.req.user); // non-strict == because might be as string in module params
			}).forEach(function(rule) { // flatten structure
				rule.devices.forEach(function(devStruct) {
					if (userDevices.indexOf(devStruct[devStruct["dev_filter"]]["dev_select"]) > -1) { // filter devices by allowed list
						var _devStruct = _.clone(devStruct);
						_devStruct.channel = rule.recipient_type === "channel" ? rule.channel : null;
						devsStruct.push(_devStruct);
					}
				});
			});
			reply.data = devsStruct;
			reply.code = 200;
		} else {
			reply.code = 501;
			reply.error = "Not implemented. Activate NotificationFilter app";
		}

		return reply;
	},
	notificationFilteringSet: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
		    self = this;

		var userConfig = [];
		try {
			var reqObj = parseToObject(this.req.body);
			
			// Transform to NotificationFiltring format
			// Do sanity check not to let user break global NotificationFiltring config
			reqObj.forEach(function(rule) {
				var channel = rule.channel;
				rule.channel = undefined;
				
				if (!rule["dev_filter"] || !rule[rule["dev_filter"]]["dev_select"]) return;
				
				userConfig.push({
					recipient_type: channel ? "channel" : "user",
					user: channel ? undefined : self.req.user,
					channel: channel ? channel : undefined,
					logLevel: "",
					devices: [rule]
				});
			});
		} catch (e) {
			return reply.error = e.message;
		}
		
		this.controller.emit('notificationFiltering.userConfigUpdate', this.req.user, userConfig);
		
		reply.code = 200;

		return reply;
	},
	notificationChannelsGet: function(all) {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
		    self = this;
		
		var channels = this.controller.notificationChannels;
		
		reply.data = Object.keys(channels).map(function(ch) {
			var profile = self.controller.getProfile(channels[ch].user);
			return _.extend({id: ch, userName: profile ? profile.name : "-" }, channels[ch]);
		}).filter(function(ch) {
			return ch.user == self.req.user || (all && self.req.role === self.ROLE.ADMIN);
		});
		reply.code = 200;

		return reply;
	},
	notificationChannelsGetAll: function() {
		return this.notificationChannelsGet(true);
	},
	// namespaces
	listNamespaces: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			nspc;

		nspc = this.controller.namespaces;

		if (_.isArray(nspc) && nspc.length > 0) {
			reply.data = nspc;
			reply.code = 200;
		} else {
			reply.code = 404;
			reply.error = "Namespaces array is null";
		}

		return reply;
	},
	getNamespaceFunc: function(namespaceId) {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			namespace;

		namespace = this.controller.getListNamespaces(namespaceId, this.controller.namespaces);
		if (!namespace || (_.isArray(namespace) && namespace.length < 1)) {
			reply.code = 404;
			reply.error = "No namespaces found with this path: " + namespaceId;
		} else {
			reply.data = namespace;
			reply.code = 200;
		}

		return reply;
	},
	// restart
	restartController: function(profileId) {
		var reply = {
			error: null,
			data: null,
			code: 200
		};

		this.controller.restart();
		return reply;
	},
	loadModuleMedia: function(moduleName, fileName) {
		var reply = {
				error: null,
				data: null,
				code: 200
			},
			obj, _obj;

		if ((moduleName !== '' || !!moduleName || moduleName) && (fileName !== '' || !!fileName || fileName)) {
			obj = this.controller.loadModuleMedia(moduleName, fileName);
			
			if (obj && obj.data === "") { // for folder we will get empty - try to open index.html
				_obj = this.controller.loadModuleMedia(moduleName, fileName + "/index.html");
				if (_obj && !!_obj.data) {
					obj = _obj;
				}
			}

			if (!this.controller.modules[moduleName]) {
				reply.code = 404;
				reply.error = "Can't load file from app because app '" + moduleName + "' was not found.";

				return reply;

			} else if (obj !== null) {
				this.res.status = 200;
				this.res.headers = {
					"Content-Type": obj.ct
				};
				this.res.body = obj.data;

				return null; // let handleRequest take this.res as is
			} else {
				reply.code = 500;
				reply.error = "Failed to load file from module.";

				return reply;
			}
		} else {
			reply.code = 400;
			reply.error = "Incorrect app or file name";

			return reply;
		}
	},
	loadImage: function(imageName) {
		var reply = {
				error: null,
				data: null,
				code: 200
			},
			data;

		data = this.controller.loadImage(imageName);

		if (data !== null) {
			this.res.status = 200;
			this.res.headers = {
				"Content-Type": "image/*"
			};
			this.res.body = data;

			return null; // let handleRequest take this.res as is
		} else {
			reply.code = 500;
			reply.error = "Failed to load file.";

			return reply;
		}
	},
	uploadFile: function() {
		var reply = {
				error: null,
				data: null,
				code: 200
			},
			file;

		if (this.req.method === "POST" && this.req.body) {

			for (prop in this.req.body) {
				if (this.req.body[prop]['content']) {
					file = this.req.body[prop];
				}
			}

			if (_.isArray(file)) {
				file = file[0];
			}

			if (file && file.name && file.content || (_.isArray(file) && file.length > 0)) {

				if (~file.name.indexOf('.csv') && typeof Papa === 'object') {
					var csv = null;
					Papa.parse(file.content, {
						header: true,
						dynamicTyping: true,
						complete: function(results) {
							csv = results;
						}
					});

					if (!!csv) {
						saveObject(file.name, csv, true);
					}
				} else {
					// Create Base64 Object
					saveObject(file.name, Base64.encode(file.content), true);
				}

				reply.code = 200;
				reply.data = file.name;

			} else {
				reply.code = 500;
				reply.error = "Failed to upload file";
			}
		} else {
			reply.code = 400;
			reply.error = "Invalid request";
		}
		return reply;
	},
	backup: function() {
		var self = this,
			reply = {
				error: null,
				data: null,
				code: 500
			};

		var now = new Date();
		// create a timestamp in format yyyy-MM-dd-HH-mm
		var ts = getHRDateformat(now);

		try {

			var backupJSON = self.controller.createBackup();

			reply.headers = {
				"Content-Type": "application/octet-stream", // application/x-download octet-stream
				"Content-Disposition": "attachment; filename=z-way-backup-" + ts + ".zab"
			};

			reply.code = 200;
			reply.data = Base64.encode(JSON.stringify(backupJSON));
		} catch (e) {
			reply.code = 500;
			reply.error = e.toString();
		}

		return reply;
	},
	restore: function() {
		var self = this,
			reqObj,
			reply = {
				error: null,
				data: null,
				code: 500
			},
			result = "",
			langfile = this.controller.loadMainLang(),
			dontSave = this.controller.getIgnoredStorageFiles([
				"__ZWay",
				"__EnOcean",
				"__userModules",
				"__userSkins"
			]);

		function waitForInstallation(allreadyInstalled, reqKey) {
			var d = Date.now() + 300000; // wait not more than 5 min

			while (Date.now() < d && allreadyInstalled.length <= reqObj.data[reqKey].length) {

				if (allreadyInstalled.length === reqObj.data[reqKey].length) {
					break;
				}

				processPendingCallbacks();
			}

			if (allreadyInstalled.length === reqObj.data[reqKey].length) {
				// success
				reply.code = 200;
			}
		}

		// get flag that network information should be overwritten
		allowTopoRestore = this.req.body.hasOwnProperty("overwriteNetwork") ? retBoolean(this.req.body.overwriteNetwork) : false;

		try {
			function utf8Decode(bytes) {
				var chars = [];

				for (var i = 0; i < bytes.length; i++) {
					chars[i] = bytes.charCodeAt(i);
				}

				return chars;
			}

			reqObj = parseToObject(this.req.body.backupFile.content);

			if (typeof reqObj.data === 'string') {
				// new .zab files are base64 encoded, while old are not
				decodeData = Base64.decode(reqObj.data);
				// to JSON
				reqObj.data = JSON.parse(decodeData);
			}

			// check if data is not empty
			if (!reqObj.data) {
				// missing file
				reply.code = 400;
				reply.error = "Bad Request. Please input a .zab backup file.";

				return reply;
			}

			// stop the controller
			this.controller.stop();


			for (var obj in reqObj.data) {

				if (dontSave.indexOf(obj) === -1) {
					saveObject(obj, reqObj.data[obj], true);
					console.log('Restore', obj, '... done');
				}
			}

			// start controller with reload flag to apply config.json
			this.controller.start(true);

			// restore Z-Wave and EnOcean
			!!reqObj.data["__ZWay"] && Object.keys(reqObj.data["__ZWay"]).forEach(function(zwayName) {
				var zwayData = utf8Decode(reqObj.data["__ZWay"][zwayName]);
				global.ZWave[zwayName] && global.ZWave[zwayName].zway.controller.Restore(zwayData, allowTopoRestore);
			});

			/* TODO
			!!reqObj.data["__EnOcean"] && reqObj.data["__EnOcean"].forEach(function(zenoName) {
				// global.EnOcean[zenoName] && global.EnOcean[zenoName].zeno.Restore(reqObj.data["__EnOcean"][zenoName]);
			});
			*/

			// install userModules
			if (reqObj.data["__userModules"]) {
				var installedModules = [];

				_.forEach(reqObj.data["__userModules"], function(entry) {

					http.request({
						url: 'https://developer.z-wave.me/?uri=api-module-archive/' + entry.name,
						method: 'GET',
						async: true,
						success: function(res) {
							var archiv = [],
								item = {
									name: entry.name
								},
								location = 'modules/' + entry.name,
								overwriteCoreModule = false;

							if (res.data.data && res.data.data.length > 0) {
								archiv = _.filter(res.data.data, function(appEntry) {
									return appEntry.version === entry.version.toString();
								})

								// check if already loaded module is a core module
								coreModule = self.controller.modules[entry.name] && self.controller.modules[entry.name].meta ? (self.controller.modules[entry.name].meta.location === location) : false;

								// check if version of core module isn't higher than the restored one
								if (coreModule) {
									overwriteCoreModule = has_higher_version(entry.version, self.controller.modules[entry.name].meta.version);
								}

								// if achive was found try to download it
								if (archiv.length > 0 && (!coreModule || (coreModule && overwriteCoreModule))) {

									console.log('Restore userModule', archiv[0].modulename, 'v' + archiv[0].version);
									result = self.controller.installModule('https://developer.z-wave.me/archiv/' + archiv[0].archiv, archiv[0].modulename);

									item.status = result;
									if (result === "done") {
										loadSuccessfully = self.controller.reinitializeModule(entry.name, 'userModules/', true);

										if (!loadSuccessfully) {
											self.controller.addNotification("warning", langfile.zaap_war_restart_necessary + ' :: ' + entry.name + ' ' + 'v' + archiv[0].version, "core", "AppInstaller");
										}
									} else {
										self.controller.addNotification("warning", langfile.zaap_err_app_install + ' :: ' + entry.name + ' ' + 'v' + archiv[0].version, "core", "AppInstaller");
									}
								} else {
									// downlaod latest if it isn't already there
									if (overwriteCoreModule) {

										console.log(entry.name + ':', 'No archive with this version found. Install latest ...');
										result = self.controller.installModule('https://developer.z-wave.me/modules/' + entry.name + '.tar.gz', entry.name);

										item.status = result;

										if (result === "done") {
											self.controller.reinitializeModule(entry.name, 'userModules/', false);
											self.controller.addNotification("warning", langfile.zaap_war_app_installed_corrupt_instance + ' :: ' + entry.name, "core", "AppInstaller");
										} else {
											self.controller.addNotification("error", langfile.zaap_err_app_install + ' :: ' + entry.name, "core", "AppInstaller");
										}
									} else {
										self.controller.addNotification("warning", langfile.zaap_war_core_app_is_newer + ' :: ' + entry.name, "core", "AppInstaller");
										item.status = 'failed';
									}
								}
							} else {
								self.controller.addNotification("error", langfile.zaap_err_no_archives + ' :: ' + entry.name, "core", "AppInstaller");
								item.status = 'failed';
							}

							installedModules.push(item);
						},
						error: function(res) {
							self.controller.addNotification("error", langfile.zaap_err_server + ' :: ' + entry.name + '::' + res.statusText, "core", "AppInstaller");
							installedModules.push({
								name: entry.name,
								status: 'failed'
							});
						}
					});
				});

				waitForInstallation(installedModules, "__userModules");

			}

			// install userSkins
			if (reqObj.data["__userSkins"]) {
				var installedSkins = [],
					remoteSkins = [];

				http.request({
					// get online list of all existing modules first
					url: 'https://developer.z-wave.me/?uri=api-skins',
					method: 'GET',
					async: true,
					success: function(res) {
						if (res.data.data) {
							remoteSkins = res.data.data;

							// download all skins that are online available
							_.forEach(reqObj.data["__userSkins"], function(entry) {
								var item = {
										name: entry.name,
										status: 'failed'
									},
									// check if backed up skin is in online list
									remSkinObj = _.filter(remoteSkins, function(skin) {
										return skin.name === entry.name;
									});

								if (remSkinObj[0]) {

									index = _.findIndex(self.controller.skins, function(skin) {
										return skin.name === entry.name;
									});

									try {
										// install skin
										result = self.controller.installSkin(remSkinObj[0], entry.name, index);
										item.status = result;
									} catch (e) {
										self.controller.addNotification("error", langfile.zaap_err_no_archives + ' :: ' + entry.name, "core", "SkinInstaller");
									}
								}

								installedSkins.push(item);

							});
						}
					},
					error: function(res) {
						self.controller.addNotification("error", langfile.zaap_err_server + ' :: ' + res.statusText, "core", "SkinInstaller");
					}
				});

				waitForInstallation(installedSkins, "__userSkins");

			}

			// success
			reply.code = 200;
			reply.data = {
				userModules: installedModules,
				userSkins: installedSkins
			};

		} catch (e) {
			reply.error = e.toString();
		}

		return reply;
	},
	resetToFactoryDefault: function() {
		var self = this,
			langFile = this.controller.loadMainLang();
		reply = {
				error: null,
				data: null,
				code: 500
			};

		{
			var backupCfg = loadObject("backupConfig"),
			storageContentList = loadObject("__storageContent"),
			defaultConfigExists = fs.stat('defaultConfigs/config.json'), // will be added during build - build depending
			defaultConfig = {},
			defaultSkins = [{
				name: "default",
				title: "Default",
				description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.",
				version: "1.0.3",
				icon: true,
				author: "Martin Vach",
				homepage: "http://www.zwave.eu",
				active: true
			}],
			now = new Date();

			try {

				if (defaultConfigExists && defaultConfigExists.type !== 'dir' && defaultConfigExists.size > 0) {
					defaultConfig = fs.loadJSON('defaultConfigs/config.json');
				}

				if (!!defaultConfig && !_.isEmpty(defaultConfig)) {

					var ts = now.getFullYear() + "-";
					ts += ("0" + (now.getMonth() + 1)).slice(-2) + "-";
					ts += ("0" + now.getDate()).slice(-2) + "-";
					ts += ("0" + now.getHours()).slice(-2) + "-";
					ts += ("0" + now.getMinutes()).slice(-2);

					console.log('Backup config ...');
					// make backup of current config.json
					saveObject('backupConfig' + ts, loadObject('config.json'), true);

					// remove all active instances of moduleId
					this.controller.instances.forEach(function(instance) {
						if (instance.moduleId !== 'ZWave') {
							self.controller.deleteInstance(instance.id);
						}
					});

					if (typeof zway !== "undefined" && zway) {
						// reset z-way controller
						console.log('Reset Controller ...');
						var d = Date.now() + 15000; // wait not more than 15 sec

						zway.controller.SetDefault();

						while (Date.now() < d && zway.controller.data.controllerState.value === 20) {
							processPendingCallbacks();
						}

						// remove instances of ZWave at least
						// filter for instances of ZWave
						zwInstances = this.controller.instances.filter(function(instance) {
							return instance.moduleId === 'ZWave';
						}).map(function(instance) {
							return instance.id;
						});

						// remove instance of ZWave
						if (zwInstances.length > 0) {
							zwInstances.forEach(function(instanceId) {
								console.log('Remove ZWave instance: ' + instanceId);
								self.controller.deleteInstance(instanceId);
							});
						}
					}

					console.log('Remove and unload userModules apps ...');
					// unload and remove modules
					Object.keys(this.controller.modules).forEach(function(className) {
						var meta = self.controller.modules[className],
							unload = '',
							locPath = meta.location.split('/'),
							success = false;

						if (locPath[0] === 'userModules') {
							console.log(className + ' remove it ...');

							success = self.controller.uninstallModule(className);

							if (success) {
								console.log(className + ' has been successfully removed.');
							} else {
								console.log('Cannot remove app: ' + className);
								self.addNotification("warning", langFile.zaap_err_uninstall_mod + ' ' + className, "core", "AutomationController");
							}
						}

					});

					// remove skins
					_.forEach(this.controller.skins, function(skin) {
						if (skin.name !== 'default') {
							self.controller.uninstallSkin(skin.name);
						}
					});

					// stop the controller
					this.controller.stop();

					// clean up storage
					for (var ind in storageContentList) {
						if (storageContentList[ind].indexOf('backupConfig') < 0 && !!storageContentList[ind]) {
							saveObject(storageContentList[ind], null, true);
						}
					}

					// clean up storageContent
					if (__storageContent.length > 0) {
						__saveObject("__storageContent", []);
						__storageContent = [];
					}

					// set back to default config
					saveObject('config.json', defaultConfig, true);
					saveObject('userSkins.json', defaultSkins, true);

					// start controller with reload flag to apply config.json
					this.controller.start(true);

					reply.code = 200;

					setTimeout(function() {
						self.doLogout();
					}, 3000);
				} else {
					reply.code = 404;
					reply.error = 'No default configuration file found.';
				}
			} catch (e) {
				reply.error = 'Something went wrong. Error: ' + e.toString();
			}
		}

		return reply;
	},
	getSkins: function() {
		var reply = {
			error: null,
			data: null,
			code: 500
		};

		if (this.controller.skins) {
			reply.data = this.controller.skins;
			reply.code = 200;
		} else {
			reply.error = 'failed_to_load_skins';
		}

		return reply;
	},
	getSkin: function(skinName) {
		var reply = {
			error: null,
			data: null,
			code: 500
		};

		if (this.controller.skins) {
			index = _.findIndex(this.controller.skins, function(skin) {
				return skin.name === skinName;
			});

			if (index > -1) {
				reply.data = this.controller.skins[index];
				reply.code = 200;
			} else {
				reply.code = 404;
				reply.error = 'skin_not_exists';
			}
		} else {
			reply.error = 'failed_to_load_skins';
		}

		return reply;
	},
	getActiveSkin: function() {
		var reply = {
			error: null,
			data: null,
			code: 500
		};

		if (this.controller.skins) {
			index = _.findIndex(this.controller.skins, function(skin) {
				return skin.active === true;
			});

			if (index > -1) {
				reply.data = this.controller.skins[index];
				reply.code = 200;
			} else {
				reply.code = 404;
				reply.error = 'skin_not_exists';
			}
		} else {
			reply.error = 'failed_to_load_skins';
		}

		return reply;
	},
	activateOrDeactivateSkin: function(skinName) {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			reqObj = parseToObject(this.req.body),
			skin = null;

		skin = this.controller.setSkinState(skinName, reqObj);

		try {
			if (!!skin) {
				reply.data = skin;
				reply.code = 200;
			} else {
				reply.code = 404;
				reply.error = 'skin_not_exists';
			}
		} catch (e) {
			reply.error = 'failed_to_load_skins';
			reply.message = e.message;
		}

		return reply;
	},
	addOrUpdateSkin: function(skinName) {
		var reply = {
				error: 'skin_failed_to_install',
				data: null,
				code: 500
			},
			reqObj = parseToObject(this.req.body),
			result = "",
			skName = skinName || reqObj.name;

		if (skName !== 'default') {

			index = _.findIndex(this.controller.skins, function(skin) {
				return skin.name === skName;
			});

			if ((index < 0 && this.req.method === 'POST') ||
				(index > -1 && this.req.method === 'PUT' && skinName)) {

				// download and install the skin
				result = this.controller.installSkin(reqObj, skName, index);

				if (result === "done") {
					reply.code = 200;
					reply.data = this.req.method === 'POST' ? "skin_installation_successful" : "skin_update_successful"; // send language key as response
					reply.error = null;
				}

			} else if (this.req.method === 'POST' && !skinName) {
				reply.code = 409;
				reply.error = 'skin_from_url_already_exists';
			} else if (this.req.method === 'PUT' && skinName) {
				reply.code = 404;
				reply.error = 'skin_not_exists';
			}
		} else {
			reply.code = 403;
			reply.error = 'No Permission';
		}

		return reply;
	},
	deleteSkin: function(skinName) {
		var reply = {
				error: 'skin_failed_to_delete',
				data: null,
				code: 500
			},
			uninstall = false;

		if (skinName !== 'default') {
			index = _.findIndex(this.controller.skins, function(skin) {
				return skin.name === skinName;
			});

			if (index > -1) {

				uninstall = this.controller.uninstallSkin(skinName);

				if (uninstall) {

					reply.code = 200;
					reply.data = "skin_delete_successful"; // send language key as response
					reply.error = null;
				}
			} else {
				reply.code = 404;
				reply.error = 'skin_not_exists';
			}
		} else {
			reply.code = 403;
			reply.error = 'No Permission';
		}

		return reply;
	},
	setDefaultSkin: function() {
		var self = this,
			reply = {
				error: null,
				data: null,
				code: 500
			};

		try {

			// deactivate all skins and set default skin to active: true
			_.forEach(this.controller.skins, function(skin) {
				skin.active = skin.name === 'default' ? true : false;
			})

			saveObject("userSkins.json", this.controller.skins, true);

			reply.data = "Skin reset was successfull. You'll be logged out in 3, 2, 1 ...";
			reply.code = 200;
			// do logout
			setTimeout(function() {
				self.doLogout();
			}, 3000);
		} catch (e) {
			reply.error = "Something went wrong.";
			reply.message = e.message;
		}

		return reply;
	},
	getSkinTokens: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			tokenObj = loadObject('skinTokens.json');

		if (tokenObj === null) {

			tokenObj = {
				skinTokens: []
			};

			saveObject('skinTokens.json', tokenObj, true);
		}

		if (!!tokenObj) {
			reply.data = tokenObj;
			reply.code = 200;
		} else {
			reply.error = 'failed_to_load_skin_tokens';
		}

		return reply;
	},
	storeSkinToken: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			reqObj = parseToObject(this.req.body),
			tokenObj = loadObject('skinTokens.json');

		if (reqObj && reqObj.token) {

			if (tokenObj === null) {

				tokenObj = {
					skinTokens: [reqObj.token]
				}

				// save tokens
				saveObject('skinTokens.json', tokenObj, true);

				reply.data = tokenObj;
				reply.code = 201;

			} else if (!!tokenObj && tokenObj.skinTokens) {

				if (tokenObj.skinTokens.indexOf(reqObj.token) < 0) {
					// add new token id
					tokenObj.skinTokens.push(reqObj.token);

					// save tokens
					saveObject('skinTokens.json', tokenObj, true);

					reply.data = tokenObj;
					reply.code = 201;
				} else {
					reply.code = 409;
					reply.error = 'skin_token_not_unique';
				}
			}
		} else {
			reply.error = 'failed_to_load_skin_tokens';
		}

		return reply;
	},
	deleteSkinToken: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			reqObj = parseToObject(this.req.body),
			tokenObj = loadObject('skinTokens.json');

		if (reqObj && reqObj.token && !!tokenObj && tokenObj.skinTokens) {
			if (tokenObj.skinTokens.indexOf(reqObj.token) > -1) {
				// add new token id
				tokenObj.skinTokens = _.filter(tokenObj.skinTokens, function(token) {
					return token !== reqObj.token;
				});

				// save tokens
				saveObject('skinTokens.json', tokenObj, true);

				reply.data = tokenObj;
				reply.code = 200;
			} else {
				reply.code = 404;
				reply.error = 'not_existing_skin_token';
			}
		} else {
			reply.error = 'failed_to_load_skin_tokens';
		}

		return reply;
	},
	getIcons: function() {
		var reply = {
			error: null,
			data: null,
			code: 500
		};

		if (this.controller.icons) {
			reply.data = this.controller.icons;
			reply.code = 200;
		} else {
			reply.error = 'failed_to_load_icons';
		}

		return reply;
	},
	uploadIcon: function() {
		var reply = {
			error: 'icon_failed_to_install',
			data: null,
			code: 500
		};

		for (prop in this.req.body) {
			if (this.req.body[prop]['content']) {

				file = this.req.body[prop];
			}
		}

		function utf8Decode(bytes) {
			var chars = [];

			for (var i = 0; i < bytes.length; i++) {
				chars[i] = bytes.charCodeAt(i);
			}

			return chars;
		}

		function Uint8ToBase64(uint8) {
			var i,
				extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
				output = "",
				temp, length;

			var lookup = [
				'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
				'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
				'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
				'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
				'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
				'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
				'w', 'x', 'y', 'z', '0', '1', '2', '3',
				'4', '5', '6', '7', '8', '9', '+', '/'
			];

			function tripletToBase64(num) {
				return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
			};

			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
				output += tripletToBase64(temp);
			}

			// this prevents an ERR_INVALID_URL in Chrome (Firefox okay)
			switch (output.length % 4) {
				case 1:
					output += '=';
					break;
				case 2:
					output += '==';
					break;
				default:
					break;
			}

			return output;
		}
		var data,
			bytes = new Uint8Array(utf8Decode(file.content)),
			re = /(?:\.([^.]+))?$/;
		ext = re.exec(file.name)[1];

		if (ext === 'gz') {
			var gunzip = new Zlib.Gunzip(bytes);
			data = gunzip.decompress();
		} else {
			data = bytes;
		}

		file.content = Uint8ToBase64(data);

		result = this.controller.installIcon('local', file, 'custom', 'icon');

		if (result.message === "done") {

			reply.code = 200;
			reply.data = result.files;
			reply.error = null;
		}

		return reply
	},
	addOrUpdateIcons: function(iconName) {
		var reply = {
				error: 'icon_failed_to_install',
				data: null,
				code: 500
			},
			reqObj = parseToObject(this.req.body),
			result = "",
			icName = iconName || reqObj.name,
			id = reqObj.id;

		index = _.findIndex(this.controller.icons, function(icon) {
			return icon.source === icName + "_" + id;
		});

		if (index === -1) {

			// download and install the icon
			result = this.controller.installIcon('remote', reqObj, icName, reqObj.id);

			if (result.message === "done") {

				reply.code = 200;
				reply.data = result.files;
				reply.error = null;
			}
		} else {
			reply.code = 409;
			reply.error = 'icon_from_url_already_exists';
		}

		return reply;
	},
	deleteIcons: function(iconName) {
		var reply = {
				error: 'icon_failed_to_delete',
				data: null,
				code: 500
			},
			uninstall = false;

		var reqObj = typeof this.req.body === 'string' ? JSON.parse(this.req.body) : this.req.body;

		this.controller.deleteCustomicon(iconName);

		uninstall = this.controller.uninstallIcon(iconName);

		if (uninstall) {
			reply.code = 200;
			reply.data = "icon_delete_successful";
			reply.error = null;
		}

		return reply;
	},
	getTime: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			tz = "",
			now = new Date();

		try {
			var sys = system("sh automation/lib/timezone.sh getTZ");
			sys.forEach(function(i) {
				if (typeof i === 'string') {
					tz = i.replace(/\n/g, '');
				}
			});
		} catch (e) {}

		if (now) {
			reply.code = 200;
			reply.data = {
				localTimeUT: Math.round((now.getTime() + (now.getTimezoneOffset() * -60000)) / 1000), // generate timestamp with correct timezone offset
				localTimeString: now.toLocaleString(),
				localTimeZoneOffset: now.getTimezoneOffset() / 60,
				localTimeZone: tz,
				localGMT: now.toString().match(/([-\+][0-9]+)\s/)[1]
			};
		} else {
			reply.error = 'Cannot get current date and time.';
		}

		return reply;
	},
	setTimezone: function() {
		var self = this,
			langfile = this.controller.loadMainLang();
		reply = {
				error: null,
				data: null,
				code: 500
			},
			data = {
				"act": "set",
				"tz": ""
			};

		reqObj = parseToObject(this.req.body);

		data.tz = reqObj.timeZone;

		try {
			if (system("sh automation/lib/timezone.sh setTZ " + reqObj.timeZone)[0] !== 0) {
				throw "Failed to set timezone";
			} else {
				reply.code = 200;

				// reboot after 5 seconds
				setTimeout(function() {
					try {
						console.log("Rebooting system ...");
						system("reboot"); // reboot the box
					} catch (e) {
						self.controller.addNotification("error", langfile.zaap_err_reboot, "core", "SetTimezone");
					}
				}, 5000);
			}
		} catch (e) {
			reply.error = res.statusText + "; " + e.toString();
		}

		return reply;
	},
	getRemoteId: function() {
		var self = this,
			reply = {
				error: null,
				data: null,
				code: 500
			};

		try {
			reply.code = 200;
			reply.data = {
				remote_id: self.controller.getRemoteId()
			};

		} catch (e) {
			if (e.name === "service-not-available") {
				reply.code = 503;
				reply.error = e.message;
			} else {
				reply.code = 500;
				reply.error = e.message;
			}
		}
		return reply;
	},
	getIPAddress: function() {
		var self = this,
			reply = {
				error: null,
				data: null,
				code: 500
			},
			ip = self.controller.getIPAddress();

		if (ip) {
			reply.code = 200;
			reply.data = {
				ip_address: ip
			};
		} else {
			reply.code = 500;
			reply.error = "syscommad-not-set";
		}
		return reply;
	},
	// set a timout for accessing firmware update tab of 8084
	setWebifAccessTimout: function() {
		var reply = {
				error: null,
				data: null,
				code: 500
			},
			allowAcc = 0,
			timeout = 900; // in s ~ 15 min

		allowAcc = this.req.query.hasOwnProperty("allow_access") ? parseInt(this.req.query.allow_access, 10) : 0;
		timeout = this.req.query.hasOwnProperty("timeout") ? parseInt(this.req.query.timeout, 10) : timeout;

		if (allowAcc === 1 && timeout > 0 && timeout <= 1200) {
			saveObject('8084AccessTimeout', timeout, true);
			reply.code = 200;
			reply.data = {
				timeout: timeout
			};
		} else if (allowAcc === 0) {
			saveObject('8084AccessTimeout', null, true);
			reply.code = 200;
			reply.data = {
				timeout: null
			};
		} else {
			reply.code = 400;
			reply.error = 'Invalid Request';
		}

		return reply;
	},
	getFirstLoginInfo: function() {
		var reply = {
				error: null,
				data: {},
				code: 500
			},
			defaultProfile = [],
			setLogin = {};
		try {
			defaultProfile = _.filter(this.controller.profiles, function(profile) {
				return profile.login === 'admin' && profile.password === 'admin';
			});

			if ((!this.controller.config.first_start_up && defaultProfile.length > 0) || (defaultProfile.length > 0 && (typeof this.controller.config.firstaccess === 'undefined' || this.controller.config.firstaccess)) || (defaultProfile.length > 0 && !this.controller.config.firstaccess)) {
				setLogin = this.setLogin(defaultProfile[0], this.req);
				reply.headers = setLogin.headers; // set '/' Z-Way-Session root cookie
				reply.data.defaultProfile = setLogin.data; // set login data of default profile
				reply.data.firstaccess = true;
				reply.data.defaultProfile.showWelcome = true;
			} else {
				reply.data.firstaccess = false;
			}
			reply.data.uuid = this.controller.getUUID();
			reply.data.serial = this.controller.getSerial();
			reply.data.mac = this.controller.getMACAddress();
			reply.data.remote_id = this.controller.getRemoteId();
			reply.data.ip_address = this.controller.getIPAddress();
			reply.code = 200;
		} catch (e) {
			reply.data = null;
			reply.error = e.message;
		}

		return reply;
	},
	getSystemInfo: function() {
		var reply = {
				error: null,
				data: {},
				code: 500
			},
			versionArr = [];

		try {
			versionArr = zway.controller.data.softwareRevisionVersion.value.substring(1).split('-');
			version = versionArr[0] ? versionArr[0] : null;
			majurity = versionArr[1] ? versionArr[1] : null;

			reply.data = {
				first_start_up: this.controller.config.first_start_up,
				count_of_reconnects: this.controller.config.count_of_reconnects,
				current_firmware: version,
				current_firmware_majurity: majurity,
				remote_id: this.controller.getRemoteId(),
				uuid: this.controller.getUUID(),
				serial: this.controller.getSerial(),
				mac: this.controller.getMACAddress(),
				firstaccess: this.controller.config.hasOwnProperty('firstaccess') ? this.controller.config.firstaccess : true
			};

			reply.code = 200;
		} catch (e) {
			reply.data = null;
			reply.error = e.message;
		}

		return reply;
	},
	rebootBox: function() {
		var self = this,
			langfile = this.controller.loadMainLang();
		reply = {
			error: null,
			data: null,
			code: 500
		};

		// if reboot has flag firstaccess=true add showWelcome to controller config
		if (this.req.query.hasOwnProperty('firstaccess') && this.req.query.firstaccess) {
			this.controller.config.showWelcome = true;
			this.controller.saveConfig(true);
		}

		// reboot after 5 seconds
		setTimeout(function() {
			try {
				console.log("Rebooting system ...");
				system("reboot"); // reboot the box
			} catch (e) {
				self.controller.addNotification("error", langfile.zaap_err_reboot, "core", "RebootBox");
			}
		}, 5000);

		reply.code = 200;
		reply.data = "System is rebooting ...";

		return reply;
	},
	getWiFiCliSettings: function() {
		// for Z-Wave.Me Hub
		try {
			var list = system("/lib/wifi-helper.sh LIST")[1].split("\n");
			list.pop(); list.pop(); list.shift(); list.shift(); // remove header and footer

			var saved = system("/lib/wifi-helper.sh GETSAVEDCONNECTION")[1].split("\n"),
			    savedEssid = saved[0].trim(), // LIST returns with spaces, so we trim in current too for uniform comparison
			    savedSecurity = saved[1],
			    savedEncryption = saved[2],
			    savedChannel = parseInt(saved[3]),
			    current = system("/lib/wifi-helper.sh GETCURRENTCONNECTION")[1].split("\n"),
			    currentEssid = current[0].trim(), // LIST returns with spaces, so we trim in current too for uniform comparison
			    currentChannel = parseInt(current[1]);
			
			// sprintf(msg+strlen(msg),"%-4s%-33s%-20s%-23s%-9s%-7s%-7s%-3s\n",
			//  "Ch", "SSID", "BSSID", "Security", "Siganl(%)", "W-Mode", " ExtCH"," NT");
			// sprintf(msg+strlen(msg)-1,"%-4s%-5s\n", " WPS", " DPID");
			
			var ret = list.map(function(l) {
				var m = l.match(/(.{4})(.{33})(.{20})(.{23})(.{9})(.{7})/);
				var sec = m[4].trim().split("/");
				return {
					saved: savedEssid === m[2].trim() && savedSecurity === sec[0] && savedEncryption === sec[1] && savedChannel === parseInt(m[1]),
					current: false, // to be filled later
					channel: parseInt(m[1]),
					essid: m[2].trim(),
					security: sec[0],
					encryption: sec[1],
					signal: parseInt(m[5])
				};
				// TODO!!! Parse WPA1PSKWPA2PSK and TKIPAES
			}).filter(function(entry) {
				return entry.essid; // skip entries with empty ESSID (can be as a result of error on weak signal)
			});
			
			var savedEntry = ret.filter(function(entry) {
				return entry.saved;
			})[0];

			if (savedEntry) {
				savedEntry.current = savedEntry.saved && currentEssid === savedEntry.essid && currentChannel === savedEntry.channel;
			} else {
				if (savedEssid && savedSecurity && savedEncryption && savedChannel) {
					ret.push({
						saved: true,
						current: false,
						channel: savedChannel,
						essid: savedEssid,
						security: savedSecurity,
						encryption: savedEncryption,
						signal: 0
					});
				}
			}

			return {
				data: ret,
				code: 200
			};
		} catch (e) {
			console.log(e.toString());
			return {
				error: 'Internal Server Error. Can not get the list of WiFi networks: ' + e.toString(),
				code: 500
			}
		}
	},
	setWiFiCliSettings: function() {
		// for Z-Wave.Me Hub
		try {
			var reqObj = parseToObject(this.req.body),
			    essid = reqObj.essid,
			    security = reqObj.security,
			    encryption = reqObj.encryption,
			    password = reqObj.password;
			
			if (essid && (!security || !encryption || !password)) throw "Missing mandatory options: essid, security, encryption, password";
			
			if (essid) {
				system('/lib/wifi-helper.sh "' + essid + '" "' + security + '" "' + encryption + '" "' + password + '"');
			} else {
				system('/lib/wifi-helper.sh DISCONNECT');
			}
			
			return {
				data: {
				},
				code: 200
			};
		} catch (e) {
			console.log(e.toString());
			return {
				error: 'Internal Server Error. Can not set WiFi network: ' + e.toString(),
				code: 500
			}
		}
	},
	getConnectionType: function() {
		// for Z-Wave.Me Hub
		try {
                    var currentConnection = system("route | grep default | awk '$5 == 0 { if ($8 == \"eth0.1\") print \"ethernet\"; else if ($8 == \"apcli0\") print \"wifi\"; else if ($8 == \"eth1\") print \"mobile\"; else print $8 }'")[1].trim();
                    var availableConnections = system("route | grep default | awk '$5 != 0 { if ($8 == \"eth0.1\") print \"ethernet\"; else if ($8 == \"apcli0\") print \"wifi\"; else if ($8 == \"eth1\") print \"mobile\"; else print $8 }'")[1].split("\n").filter(function(x) { return x != "" });
                    var possibleConnections = [ "ethernet", "wifi", "mobile" ]; // possible values
                    return {
                            data: {
                                    currentConnection: currentConnection,
                                    availableConnections: availableConnections,
                                    possibleConnections: possibleConnections
                            },
                            code: 200
                    };
		} catch (e) {
			console.log(e.toString());
			return {
				error: 'Internal Server Error. Can not check current connection type: ' + e.toString(),
				code: 500
			}
		}
	},
	setWifiSettings: function() {
		var reply = {
				error: "Wifi setup failed!",
				data: null,
				code: 500
			},
			retPp = [],
			retSsid = [],
			retR = [];

		if (fs.stat('lib/configAP.sh')) {
			try {
				reqObj = parseToObject(this.req.body);

				if (reqObj.password !== '') {
					if (reqObj.password.length >= 8 && reqObj.password.length <= 63) {
						retPp = system("sh automation/lib/configAP.sh setPp " + reqObj.password);
					} else {
						reply.error = "Password must between 8 and 63 characters long.";
						return reply;
					}
				} else {
					retPp[1] = "";
				}

				if (reqObj.ssid !== '') {
					retSsid = system("sh automation/lib/configAP.sh setSsid " + reqObj.ssid);
				} else {
					retSsid[1] = "";
				}

				if ((retSsid[1].indexOf("successfull") !== -1 || retPp[1].indexOf("successfull") !== -1) || (retSsid[1].indexOf("successfull") !== -1 && retPp[1].indexOf("successfull") !== -1)) {
					retR = system("sh automation/lib/configAP.sh reload");
					if (retR[1].indexOf("Done") !== -1) {
						reply.error = null;
						reply.data = "OK";
						reply.code = 200;
					}
				}

			} catch (e) {
				console.log(e.toString());
				reply.error = 'Internal Server Error. ' + e.toString();
			}
		} else {
			reply.error = 'Not Implemented';
			reply.code = 501;
		}

		return reply;
	},
	getWifiSettings: function() {
		var reply = {
			error: null,
			data: null,
			code: 500
		};

		if (fs.stat('lib/configAP.sh')) {
			try {

				var retSsid = system("sh automation/lib/configAP.sh getSsid");

				var ssid = retSsid[1].replace(' 0', '').replace(/\n/g, '');
				reply.code = 200;
				reply.data = {
					"ssid": ssid
				};

			} catch (e) {
				console.log(e.toString());
				reply.error = 'Internal Server Error. ' + e.toString();
			}
		} else {
			reply.error = 'Not Implemented';
			reply.code = 501;
		}

		return reply;
	},
	configNtp: function(action) {
		var reply = {
				error: "Internal Server Error",
				data: null,
				code: 500
			},
			actions = ["status", "stop", "start", "restart", "disable", "enable", "reconfigure", "setDateTime"],
			dt_regex = /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]/;

		if (fs.stat('lib/ntp.sh')) {
			try {
				reqObj = parseToObject(this.req.query);

				if (actions.indexOf(action) > -1 || (action == 'setDateTime' && reqObj.dateTime && dt_regex.exec(reqObj.dateTime))) {

					res = system("./automation/lib/ntp.sh " + action + (action == 'setDateTime' ? " '" + reqObj.dateTime + "'" : ""));

					if (action === 'status' && res[1]) {
						reply.data = JSON.parse(res[1]);
					} else {
						reply.data = res[1] ? res[1] : res;
					}

					reply.code = 200;
					reply.error = null;

				} else {
					reply.error = 'Bad Request. Allowed are: ' + actions.toString() + '?dateTime=yyyy-mm-dd hh:mm';
					reply.code = 400;
				}
			} catch (e) {
				console.log(e.toString());
				reply.error = 'Internal Server Error. ' + e.toString();
			}
		} else {
			reply.error = 'Not Implemented';
			reply.code = 501;
		}

		return reply;
	},
	zwaveDeviceInfoGet: function() {
		var reply = {
				error: null,
				code: 500,
				data: null
			},
			l = ['en', 'de'], //this.controller.availableLang
			devInfo = {},
			reqObj = !this.req.query ? undefined : parseToObject(this.req.query);

		try {

			devID = reqObj && reqObj.id ? reqObj.id : null;
			language = reqObj && reqObj.lang && l.indexOf(reqObj.lang) > -1 ? reqObj.lang : 'en';

			if (reqObj && reqObj.lang && l.indexOf(reqObj.lang) === -1) {
				reply.message = 'Language not found. English is used instead.';
			}

			devInfo = loadObject(language + '.devices.json'); //this.controller.defaultLang


			if (devInfo === null) {
				reply.code = 404;
				reply.error = 'No list of Z-Wave devices found. Please try to download them first.';
			} else {
				reply.data = devInfo;
				reply.code = 200;

				if (!!devID) {
					reply.data = _.find(devInfo.zwave_devices, function(dev) {
						return dev['Product_Code'] === devID;
					});

					if (!reply.data) {
						reply.code = 404;
						reply.error = 'No Z-Wave device with ' + devID + ' found.';
						reply.data = null;
					}
				}
			}
		} catch (e) {
			reply.error = 'Something went wrong:' + e.message;
		}

		return reply;
	},
	zwaveDeviceInfoUpdate: function() {
		var self = this,
			result = [],
			l = ['en', 'de'], //this.controller.availableLang,
			reply = {
				error: null,
				code: 500,
				data: null
			},
			delay = Date.now() + 10000; // wait not more than 10 seconds

		try {
			// update postfix JSON
			l.forEach(function(lang) {
				var obj = {},
					list = {
						updateTime: '',
						zwave_devices: []
					};

				obj[lang] = false;

				http.request({
					url: "http://manuals-backend.z-wave.info/make.php?lang=" + lang + "&mode=ui_devices",
					async: true,
					success: function(res) {
						if (res.data) {
							data = parseToObject(res.data);
							list.updateTime = Date.now();

							for (index in data) {
								list.zwave_devices.push(data[index]);
							}

							saveObject(lang + '.devices.json', list, true);
							obj[lang] = true;
						}

						result.push(obj);
					},
					error: function() {
						self.controller.addNotification('error', 'Z-Wave device list for lang:' + lang + ' not found.', 'core', 'ZAutomationAPI');
						result.push(obj);
					}
				});
			});

			while (result.length < l.length && Date.now() < delay) {
				processPendingCallbacks();
			}

			if (result) {
				reply.code = 200;
				reply.data = result;
			}

		} catch (e) {
			this.controller.addNotification('error', 'Error has occured during updating the Z-Wave devices list', 'core', 'ZAutomationAPI');
			reply.error = 'Something went wrong:' + e.message;
		}

		return reply;
	},
	zwaveVendorsInfoGet: function() {
		var reply = {
				error: null,
				code: 500,
				data: null
			},
			devInfo = {},
			reqObj = !this.req.query ? undefined : parseToObject(this.req.query);

		try {

			vendorID = reqObj && reqObj.id ? reqObj.id : null;

			devInfo = loadObject('zwave_vendors.json');

			if (devInfo === null) {
				reply.code = 404;
				reply.error = 'No list of Z-Wave vendors found. Please try to download them first.';
			} else {
				reply.data = devInfo;
				reply.code = 200;

				if (devInfo.zwave_vendors[vendorID]) {
					reply.data = devInfo.zwave_vendors[vendorID];
				} else if (reqObj.id) {
					reply.code = 404;
					reply.error = 'No Z-Wave vendor with id "' + vendorID + '" found.';
					reply.data = null;
				}
			}
		} catch (e) {
			reply.error = 'Something went wrong:' + e.message;
		}

		return reply;
	},
	zwaveVendorsInfoUpdate: function() {
		var self = this,
			result = 'in progress',
			reply = {
				error: null,
				code: 500,
				data: null
			},
			delay = Date.now() + 10000; // wait not more than 10 seconds

		try {
			// update postfix JSON
			var list = {
				updateTime: '',
				zwave_vendors: {}
			};

			http.request({
				url: "http://manuals-backend.z-wave.info/make.php?mode=brand",
				async: true,
				success: function(res) {
					if (res.data) {
						list.updateTime = Date.now();
						list.zwave_vendors = parseToObject(res.data);

						saveObject('zwave_vendors.json', list, true);

						result = 'done';

						reply.code = 200;
						reply.data = list;
					}
				},
				error: function(e) {
					var msg = 'Z-Wave vendors list could not be updated. Error: ' + e.toString();
					self.controller.addNotification('error', msg, 'core', 'ZAutomationAPI');

					result = 'failed';

					reply.code = e.status;
					reply.error = msg;
					reply.data = e.data;
				}
			});

			while (result === 'in progress' && Date.now() < delay) {
				processPendingCallbacks();
			}

			if (result === 'in progress') {
				result = 'failed';
			}

		} catch (e) {
			this.controller.addNotification('error', 'Error has occured during updating the Z-Wave devices list', 'core', 'ZAutomationAPI');
			reply.error = 'Something went wrong:' + e.message;
		}

		return reply;
	},
	redirectURL: function() {
		var self = this;
		var params = Object.keys(this.req.query).filter(function(k) { return k != "to"; }).map(function(k) { return k + "=" + self.req.query[k]; }).join("&");
		return {
			error: null,
			code: 302,
			headers: {
				"Location": this.req.query["to"] + (params ? "?" + params : "")
			}
		};
	},
	demultiplex: function(_path) {
		var self = this;
		var reply = {
			error: null,
			data: [],
			code: 200
		};

		var fullUrl = this.req.fullUrl,
		    prefix = "/demultiplex/",
		    ind;
		
		// A bit urgly logic to remove API prefix
		if (!fullUrl || (ind = fullUrl.indexOf(prefix + _path)) === -1) return { code: 500 };
		fullUrlPrefix = fullUrl.slice(0, fullUrl.indexOf(this.req.url));
		fullUrl = fullUrl.slice(ind + prefix.length);
		var prefix = _.first(self.req.url.split("/"), 2).join("/") + "/";
		
		fullUrl.split(";").forEach(function(url) {
			var path = url,
			    query = {},
			    qind = url.indexOf("?");
			if (qind > -1) {
				var q = url.slice(qind + 1);
				path = url.slice(0, qind);
				q.split("&").forEach(function(kv) {
					var kv_arr = kv.split("=");
					query[kv_arr[0]] = kv_arr[1];
				});
			}
			
			self.req.fullUrl = fullUrlPrefix + prefix + url;
			self.req.url =  prefix + path;
			self.req.query = query;
			
			var ret = self.handleRequest(self.req.url, self.req);

			var body;
			try {
				body = JSON.parse(ret.body);
			} catch(ex) {
				body = ret.body;
			}
			reply.data.push({
				status: ret.status,
				body: body
			});
		});
		
		return reply;
	}
});


ZAutomationAPIWebRequest.prototype.Unauthorized = function() {
	return {
		error: 'Not logged in',
		data: null,
		code: 401
	};
}

ZAutomationAPIWebRequest.prototype.Forbidden = function() {
	return {
		error: 'Permission denied',
		data: null,
		code: 403
	};
}

ZAutomationAPIWebRequest.prototype.dispatchRequest = function(method, url) {
	var self = this,
		handlerFunc = this.NotFound, // Default handler is NotFound
		validParams;

	var matched = this.router.dispatch(method, url);
	if (matched) {
		var auth = this.controller.auth.resolve(this.req, matched.role);
		if (!auth) {
			return this.Unauthorized;
		} else if (this.controller.auth.isAuthorized(auth.role, matched.role)) {
			if (matched.params.length) {
				validParams = _.every(matched.params),
					function(p) {
						return !!p;
					};
				if (validParams) {
					handlerFunc = function() {
						return matched.handler.apply(this, matched.params);
					}
				}
			} else {
				handlerFunc = matched.handler ? matched.handler : handlerFunc;
			}

			// --- Proceed to checkout =)
			return handlerFunc;
		} else {
			return this.Forbidden;
		}
	} else {
		return handlerFunc;
	}
};

ZAutomationAPIWebRequest.prototype.reorderDevices = function() {
	var self = this,
		reply = {
			error: "Internal Server Error",
			data: null,
			code: 500
		};

	var reqObj = typeof this.req.body !== 'object' ? JSON.parse(this.req.body) : this.req.body;

	var data = reqObj.data, // ordered list of devices
		action = reqObj.action; // Dashboard, Elements, Room(location)

	if (self.controller.reoderDevices(data, action)) {
		reply.error = "";
		reply.data = "OK";
		reply.code = 200;
	}

	//	 a = self.controller.order.elements.indexOf(reqObj[0].id);
	//	 b = self.controller.order.elements.indexOf(reqObj[1].id);
	//
	// Array.prototype.swapItems = function(a, b){
	//	 this[a] = this.splice(b, 1, this[a])[0];
	//	 return this;
	// }
	//
	//
	// self.controller.order.elements = self.controller.order.elements.swapItems(a,b);
	//

	return reply;

}
