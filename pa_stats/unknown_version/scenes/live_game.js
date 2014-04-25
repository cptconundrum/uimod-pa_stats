(function() {
	var gameIdent = decode(localStorage['lobbyId']) + "";
	var displayName = decode(sessionStorage['displayName']);
	var uberName = decode(localStorage['uberName']);
	
	function ReportData() {
		var self = this;
		self.ident = "";
		self.reporterUberName = "";
		self.reporterDisplayName = "";
		self.reporterTeam = 0;
		self.observedTeams = [];
		self.showLive = true;
		self.firstStats = {};
		self.version = paStatsGlobal.reportVersion;
		self.planet = {};
		self.paVersion = "unknown";
		self.armyEvents = [];
		self.gameStartTime = 0;
	}
	
	// flawed: fails in shared army games
//	var getTeams = function() {
//		var friends = [];
//		
//		var findFriends = function(id) {
//			for (var i = 0; i < friends.length; i++) {
//				if (friends[i][id]) {
//					return i;
//				}
//			}
//			return -1;
//		};
//		
//		for (var i = 0; i < model.players().length; i++) {
//			var player = model.players()[i];
//			
//			var friendsIndex = findFriends(player.id);
//			
//			if (friendsIndex === -1) {
//				var newTeam = {};
//				newTeam[player.id] = true;
//				for (x in player.diplomaticState) {
//					if (player.diplomaticState.hasOwnProperty(x)) {
//						if (player.diplomaticState[x].state === 'allied') {
//							newTeam[x] = true;
//						}
//					}
//				}
//				friends.push(newTeam);
//			}
//		}
//		
//		var getPlayerById = function(id) {
//			for (var i = 0; i < model.players().length; i++) {
//				if (model.players()[i].id === Number(id)) {
//					return model.players()[i];
//				}
//			}
//
//			return {};
//		};
//		
//		var teams = [];
//		var mySlotId = 0;
//		
//		for (var i = 0; i < friends.length; i++) {
//			var team = {
//				index: i,
//				players: []
//			};
//			
//			for (p in friends[i]) {
//				if (!friends[i].hasOwnProperty(p)) {
//					continue;
//				}
//				var slot = getPlayerById(p);
//
//				var player = {
//					displayName: slot.ai ? "AI" : slot.name
//				};
//
//				if (slot.name === decode(sessionStorage['displayName'])) {
//					mySlotId = i;
//				}
//				
//				team.players.push(player);
//				team.primaryColor = "rgb("+slot.primary_color[0]+","+slot.primary_color[1]+","+slot.primary_color[2]+")";
//				team.secondaryColor = "rgb("+slot.secondary_color[0]+","+slot.secondary_color[1]+","+slot.secondary_color[2]+")";
//			}
//			
//			teams.push(team);
//		}
//		
//		return {
//			teams: teams,
//			myTeamIndex: mySlotId
//		};
//	};
	
	// these are no longer part of the default live_game scene, so create my own
	var currentEnergy = ko.observable(0);
	var maxEnergy = ko.observable(0);
	var energyGain = ko.observable(0);
	var energyLoss = ko.observable(0);
	var currentMetal = ko.observable(0);
	var maxMetal = ko.observable(0);
	var metalGain = ko.observable(0);
	var metalLoss = ko.observable(0);
	var hasFirstResourceUpdate = ko.observable(false);
	
	var metalNet = ko.computed(function() {
		return metalGain() - metalLoss();
	});
	
	var energyNet = ko.computed(function() {
		return energyGain() - energyLoss();
	});
	
	var oldSimDead = handlers.sim_terminated;
	handlers.sim_terminated = function(payload) {
		paStatsGlobal.unlockGame();
		oldSimDead(payload);
	};
	
	var oldConnectionList = handlers.connection_disconnected;
	handlers.connection_disconnected = function(payload) {
		paStatsGlobal.unlockGame();
		oldConnectionList(payload);
	};
	
	var oldHandlerArmy = handlers.army;
	handlers.army = function(payload) {
		
        currentEnergy(payload.energy.current);
        maxEnergy(payload.energy.storage);
        energyGain(payload.energy.production);
        energyLoss(payload.energy.demand);

        currentMetal(payload.metal.current);
        maxMetal(payload.metal.storage);
        metalGain(payload.metal.production);
        metalLoss(payload.metal.demand);
        
        hasFirstResourceUpdate(true);
        
		if (oldHandlerArmy) {
			oldHandlerArmy(payload);
		}
	};
	
	$(".div_message_display_cont")
			.prepend(
					'<div id="pastatsadds"><div data-bind="visible: isRanked">When playing automatches PA Stats is mandatory for fairness of reporting. However you can select if you want to show live updates.</div><div data-bind="visible: isNotRanked">Send data to PA Stats: <input type="checkbox" data-bind="checked: wantsToSend"/></div>'+
					'<div data-bind="visible: liveShouldBeVisible">Show live updates on the webpage: <input type="checkbox" data-bind="checked: showDataLive"/></div></div>');
	
	model.delayTime = ko.observable(0).extend({local: 'pa_stats_delay_time'});
	
	
	model.isRanked = ko.observable().extend({local: paStatsGlobal.isRankedGameKey})
	model.isNotRanked = ko.computed(function() {
		return !model.isRanked();
	});
	model.showDataLive = ko.observable(true).extend({local: paStatsGlobal.showDataLiveKey})
	model.wantsToSend = ko.observable(true).extend({local : paStatsGlobal.wantsToSendKey});
	
	model.liveShouldBeVisible = ko.computed(function() {
		return model.wantsToSend() || model.isRanked();
	});
	
	function ValueChangeAccumulator(observable) {
		var self = this;
		self.tickValueAccumulation = 0;
		self.lastKnownValue = 0;
		self.lastChangeTime = new Date().getTime();
	
		self.doUpdate = function(newOldValue) {
			var timeOfChange = new Date().getTime();
			self.tickValueAccumulation += Math.round(self.lastKnownValue / 1000
					* (timeOfChange - self.lastChangeTime));
			self.lastKnownValue = newOldValue;
			self.lastChangeTime = timeOfChange;
		};
	
		self.reset = function() {
			self.tickValueAccumulation = 0;
		}
	
		self.get = function() {
			self.doUpdate(observable());
			var v = self.tickValueAccumulation;
			self.tickValueAccumulation = 0;
			return v;
		}
	
		observable.subscribe(function(newValue) {
			self.doUpdate(newValue);
		});
	}
	
	var wastingMetalObs = ko.computed(function() {
		if (currentMetal() == maxMetal() && metalNet() > 0) {
			return metalNet();
		} else {
			return 0;
		}
	});
	
	var wastingEnergyObs = ko.computed(function() {
		if (currentEnergy() == maxEnergy() && energyNet() > 0) {
			return energyNet();
		} else {
			return 0;
		}
	});
	
	var metalProductionAccu = new ValueChangeAccumulator(metalGain);
	var energyProductionAccu = new ValueChangeAccumulator(energyGain);
	var metalWastingAccu = new ValueChangeAccumulator(wastingMetalObs);
	var energyWastingAccu = new ValueChangeAccumulator(wastingEnergyObs);
	
	var loadedPlanet = localStorage['pa_stats_loaded_planet_json'];
	
	var apmCnt = 0;
	
	// http://stackoverflow.com/questions/2360655/jquery-event-handlers-always-execute-in-order-they-were-bound-any-way-around-t
	// [name] is the name of the event "click", "mouseover", ..
	// same as you'd pass it to bind()
	// [fn] is the handler function
	$.fn.bindFirst = function(name, fn) {
		// bind as you normally would
		// don't want to miss out on any jQuery magic
		this.on(name, fn);
	
		// Thanks to a comment by @Martin, adding support for
		// namespaced events too.
		this.each(function() {
			var handlers = $._data(this, 'events')[name.split('.')[0]];
			// take out the handler we just inserted from the end
			var handler = handlers.pop();
			// move it at the beginning
			handlers.splice(0, 0, handler);
		});
	};
	
	var actionsSinceLastTick = 0;
	
	$(document).ready(function() {
		$(document).bindFirst("keyup", function(e) {
			actionsSinceLastTick++;
		});
		$(document).bindFirst("mousedown", function(e) {// click onto ui elements
			actionsSinceLastTick++;
		});
		$('holodeck').bindFirst("mousedown", function(e) { // click into 3d world
			actionsSinceLastTick++;
		});
	});
	
	function getApm() {
		var apm = actionsSinceLastTick;
		actionsSinceLastTick = 0;
		return apm;
	}
	
	var startedSendingStats = false;
	var gameLinkId = undefined;
	
	function maySetupReportInterval() {
		if (!startedSendingStats && !gameIsOverOrPlayerIsDead
				&& paStatsGlobal.reportVersion >= localStorage['pa_stats_req_version']) {
			startedSendingStats = true;
			actionsSinceLastTick = 0;
			setInterval(model.sendStats, 5000);
		}
	}
	
	var gameIsOverOrPlayerIsDead = false;
	
	var playStartTime = undefined;
	
	function updatePlayStartTime() {
		var serverNow = getServerTimeForNow();
		if (serverNow != undefined) {
			playStartTime = serverNow;
		} else {
			var now = new Date().getTime();
			callServerTime(function(t) {
				var nowAfterCall = new Date().getTime();
				var diff = nowAfterCall - now;
				playStartTime = t-diff;
			});
		}
	}
	
	var oldServerState = handlers.server_state;
	handlers.server_state = function(m) {
		if (m.state !== 'game_over' && m.url && m.url !== window.location.href) {
			paStatsGlobal.unlockGame();
		}
		switch(m.state) {
			case 'landing':
				pasHadReconnect = false;
				break;
			case 'game_over':
				gameIsOverOrPlayerIsDead = true;
				paStatsGlobal.unlockGame();
				break;
			case 'playing':
				updatePlayStartTime();
				maySetupReportInterval();
				break;
		}
		oldServerState(m);
	};
	
	var oldNavToMainMenupas = model.navToMainMenu;
	model.navToMainMenu = function() {
		paStatsGlobal.unlockGame(oldNavToMainMenupas);
	}
	
	var oldExitpas = model.exit;
	model.exit = function() {
		paStatsGlobal.unlockGame(oldExitpas);
	}
	
	hasFirstResourceUpdate.subscribe(function(v) {
		if (v) {
			maySetupReportInterval();
		}
	});
	
	var deathReported = false;
	var addedDeathListener = false;
	function addDeathListener() {
		addedDeathListener = true;
		model.armySize.subscribe(function(v) {
			if (v == 0 && !deathReported) { // army count = 0 > the player died!
				$.ajax({
					type : "PUT",
					url : paStatsGlobal.queryUrlBase + "report/idied",
					contentType : "application/json",
					data : JSON.stringify({
						gameLink : gameLinkId
					}),
				});
				deathReported = true;
			}
		});
	}
	
	var updateTimeCnt = 0;
	var mostRecentServerTime = undefined;
	var mostRecentServerTimeInLocalTime = undefined;
	
	function getServerTimeForNow() {
		if (mostRecentServerTimeInLocalTime == undefined) {
			return undefined;
		} else {
			var now = new Date().getTime();
			var diff = now - mostRecentServerTimeInLocalTime;
			return mostRecentServerTime + diff;
		}
	}
	
	function callServerTime(handler) {
		$.get(paStatsGlobal.queryUrlBase + "report/get/time", function(timeMs) {
			handler(timeMs);
		});
	}
	
	model.updateServerAndLocalTime = function () {
		callServerTime(function(timeMs) {
			mostRecentServerTime = timeMs.ms;
			mostRecentServerTimeInLocalTime = new Date().getTime();
		});
	}
	
	model.updateServerAndLocalTime();
	
	var pasCapturedEvents = [];
	
	var pasHadReconnect = true;
	var pasKnownIdLimit = undefined;
	var pasSeenConstructionEvents = {};
	
	alertsManager.addListener(function(payload) {
		
		function makeArmyEvent(spec, x, y, z, planetId, watchType, time) {
			return {
				spec: spec,
				x: x,
				y: y,
				z: z,
				planetId: planetId,
				watchType: watchType,
				time: time
			};
		}
		
		if (mostRecentServerTime !== undefined) { // in this case we just can wait until we have the first time. Should only matter for reconnects
			for (var i = 0; i < payload.list.length; i++) {
				var notice = payload.list[i];
				
				if (pasKnownIdLimit === undefined) {
					// this check is based on the assumption that the unit ID will always go up. I wonder if that is correct
					pasKnownIdLimit = notice.id; // below this id no checks for false "destroyed" events will be done to prevent huge problems in case of reconnects at the price of not perfect data (possibility for false destroy-events in case of destroyed half finished buildings from before the reconnect) in those case.
				}
				
				if (notice.watch_type == 0 || notice.watch_type == 2) {
					if (notice.watch_type == 0) {
						pasSeenConstructionEvents[notice.id] = true;
					}
					
					if (notice.watch_type != 2 || (pasHadReconnect && pasKnownIdLimit >= notice.id) || pasSeenConstructionEvents[notice.id]) {
						if (notice.watch_type == 2) {
							delete pasSeenConstructionEvents[notice.id]; // prevent the set from growing forever
						}
						pasCapturedEvents.push(makeArmyEvent(
								notice.spec_id,
								notice.location.x,
								notice.location.y,
								notice.location.z,
								notice.planet_id,
								notice.watch_type,
								getServerTimeForNow())
						);
					} // else we got an "destroyed" event for a building that wasn't finished in the first place.
				}
			}
		}
	});
	
	model.sendStats = function() {
		if (!hasFirstResourceUpdate() // game has not yet started
				|| gameIsOverOrPlayerIsDead // review
				|| (model.armySize() == 0) // observer
				|| paStatsGlobal.reportVersion < localStorage['pa_stats_req_version'] // bad version
				|| model.showTimeControls() // chonocam
				|| (!model.wantsToSend() && !decode(localStorage[paStatsGlobal.isRankedGameKey])) // user refused at the start of the game, careful of ranked, PA Stats is mandatory for them
				|| playStartTime === undefined) { // quering the starttime from the server has not yet been successful
			actionsSinceLastTick = 0;
			return;
		}
	
		if (playStartTime === null) {
			updatePlayStartTime();
			return;
		}
		
		updateTimeCnt++;
		if (updateTimeCnt % 12 == 0) {
			model.updateServerAndLocalTime();
		}
		
		if (!addedDeathListener) {
			addDeathListener();
		}
	
		var statsPacket = {};
		statsPacket.armyCount = model.armySize();
		statsPacket.metalIncomeNet = metalNet();
		statsPacket.energyIncomeNet = energyNet();
		statsPacket.metalStored = currentMetal();
		statsPacket.energyStored = currentEnergy();
		statsPacket.metalProducedSinceLastTick = metalProductionAccu.get();
		statsPacket.energyProducedSinceLastTick = energyProductionAccu.get();
		statsPacket.metalWastedSinceLastTick = metalWastingAccu.get();
		statsPacket.energyWastedSinceLastTick = energyWastingAccu.get();
		statsPacket.metalSpending = metalLoss();
		statsPacket.energySpending = energyLoss();
		statsPacket.metalIncome = metalGain();
		statsPacket.energyIncome = energyGain();
		statsPacket.apm = getApm();
	
		var report = undefined;
	
		if (gameLinkId === undefined) {
			report = new ReportData();
			
//			var teams = getTeams();
			
			report.ident = gameIdent;
			report.reporterUberName = uberName;
			report.reporterDisplayName = displayName;
			report.reporterTeam = decode(localStorage[paStatsGlobal.pa_stats_session_team_index]);  //teams.myTeamIndex;
			report.observedTeams =  decode(localStorage[paStatsGlobal.pa_stats_session_teams]); //teams.teams;
			report.showLive = model.showDataLive();
			report.firstStats = statsPacket;
			report.paVersion = model.buildVersion();
			
			report.planet = {
					json:loadedPlanet
			};
			
			report.armyEvents = pasCapturedEvents;
			
			report.gameStartTime = playStartTime;
		} else {
			report = {};
			report.gameLink = gameLinkId;
			report.stats = statsPacket;
			
			report.armyEvents = pasCapturedEvents;
		}
		pasCapturedEvents = [];
		
		// queryUrlBase is determined in global.js
		$.ajax({
			type : "PUT",
			url : paStatsGlobal.queryUrlBase + "report",
			contentType : "application/json",
			data : JSON.stringify(report),
			success : function(result) {
				if (gameLinkId === undefined) {
					gameLinkId = result.gameLink;
					localStorage['pa_stats_game_link'] = encode(gameLinkId);
					$("#pastatsadds").remove();
				}
			}
		});
	}	
}());