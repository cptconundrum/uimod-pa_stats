(function() {
	var oldJoinGame = model.joinGame;
	model.joinGame = function(lobbyId) {
		localStorage['lobbyId'] = encode(lobbyId);
		oldJoinGame(lobbyId);
	}
	checkPaStatsVersion();

	function showInfoMessage() {
		var lastVersion = localStorage[paStatsGlobal.pa_stats_stored_version];

		var htmlMsg = '<div id="pa_stats_welcome" title="" style="visibility:hidden">' + 
	    '<div style="font-size: 2em; font-weight: bold;">' +
	        'Welcome to PA Stats' +
	    '</div>' +
		'<div>Your PA Stats Version was automatically updated to the latest version.</div>' +
		'<div>Visit www.nanodesu.info/pastats/updates for the most recent Changelog.</div>' +
	    '<div style="margin: 10px 0px;">' +
	        'By clicking <b>Accept</b> below, you acknowledge that you have read and agree to the '+
	        'following conditions.'+
	    '</div>'+
	    '<div id="div_eula_cont" style="height: auto; width: 550px; border: 1px solid #333;'+
	        'overflow: auto; padding: 10px;">'+
	        '<p>If you should notice possible bugs in the UI, especially after patches, please try to disable PA Stats and any other UI-mod before reporting any bugs to Uber. Just to make sure Uber is not given bugreports, just because a new patch broke PA Stats. Report such bugs to me instead, I will always try to fix up PA Stats after patches as fast as possible and often PA Stats just keeps working :)</p>'+
			'<p>By using PA Stats you agree that arbitrary data on your gameplay will be gathered, processed and published on www.nanodesu.info/pastats so you and anyone else can analyze it.</p>'+
			'<p>Data however will only be processed in the interest of gameplay-analysis. No profit will be made with any data gathered</p>'+
			'<p>If you disagree please either uncheck "Send Data to PA Stats" ingame, which prevents any data from being sent, or deinstall PA Stats.</p>'+
			'<p>If you want a specific game deleted from the page contact me (Cola_Colin) in the Uberent forums.</p>'+
			'<p>This message will be displayed once for every bigger update that is made to PA Stats</p>'+
	    '</div>'+
	'</div>'
		
		$("body").append(htmlMsg);

		if (lastVersion != paStatsGlobal.reportVersion) {
			$('#pa_stats_welcome').attr("style", "visibility:visible");
			$('#pa_stats_welcome').dialog({
				dialogClass: "no-close",
				closeOnEscape : false,
				draggable : false,
				resizable : false,
				height : 800,
				width : 800,
				modal : true,
				buttons : {
					"ACCEPT" : function() {
						localStorage[paStatsGlobal.pa_stats_stored_version] = paStatsGlobal.reportVersion;
						$(this).dialog("close");
					}
				}
			});
		}
	}

	showInfoMessage();	
}());