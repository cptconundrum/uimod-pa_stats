// I think actually this scene is not used at all...

//
//(function() {
//	
//	
//	
//	
//	localStorage[paStatsGlobal.isRankedGameKey] = encode(false);
//	
//	var loadPlanet = ko.observable({}).extend({ local: 'pa_stats_loaded_planet' });
//	model.loadedSystem.subscribe(function(v) {
//		loadPlanet(paStatsGlobal.createSimplePlanet(v));
//	});
//	
//	var joinedTeamIndexWasSet = false;
//	var joinedTeamIndex = 0;
//	var paStatsOldJoin = model.join;
//	model.join = function(army_index, slot_index) {
//		joinedTeamIndex = army_index;
//		joinedTeamIndexWasSet = true;
//		paStatsOldJoin(army_index, slot_index);
//	}
//	
//	function getJoinedTeamIndex() {
//		if (joinedTeamIndexWasSet) {
//			return joinedTeamIndex;
//		} else {
//			// in case of reloaded UI we can only try to get the id by the displayname...
//			for (var a = 0; a < model.armies().length; a++) {
//				var army = model.armies()[a];
//				for (var p = 0; p < army.openSlots().length; p++) {
//					if (model.displayName() === army.openSlots()[p].playerName()) {
//						return a;
//					}
//				}
//			}
//			return 0; // no idea what to to do here.
//		}
//	}
//	
//	function getTeams() {
//		var result = [];
//		
//		for (var a = 0; a < model.armies().length; a++) {
//			var army = model.armies()[a];
//			var team = {
//				index: a,
//				players: [],
//			}
//			
//			for (var p = 0; p < army.openSlots().length; p++) {
//				var slot = army.openSlots()[p];
//				
//				var isHuman = slot.isPlayer();
//				var isAi = slot.isAI();
//
//				var player = {
//					displayName: isAi ? "AI" : army.openSlots()[p].playerName(),
//				};
//				
//				if (isHuman || isAi) {
//					team.players.push(player);
//				}
//				
//				// TODO support colors per player instead of per team!
//				team.primaryColor = slot.primaryColor();
//				team.secondaryColor = slot.secondaryColor();
//			}
//			
//			result.push(team);
//		}
//		return {
//			teams: result,
//			myTeamIndex: getJoinedTeamIndex()
//		};
//	}
//	
//	var oldServerState = handlers.server_state;
//	handlers.server_state = function(msg) {
//		if (msg.url && msg.url !== window.location.href && msg.state == 'landing') {
//			var d = getTeams();
//			localStorage[paStatsGlobal.pa_stats_session_teams] = encode(d.teams);
//			localStorage[paStatsGlobal.pa_stats_session_team_index] = encode(d.myTeamIndex);
//		}
//		
//		oldServerState(msg);
//	}
//}());