TVEngine.Tracker = TVEngine.Tracker || {};
TVEngine.Tracker.Omniture = {
	trackEvent: function(options){
		if (disableOmniture) {
			//$log("omniture disabled!");
			return;
		}
		/*s.pageName => human readable page name (i.e.: Video - Featured Clips - January Pipes) 
		s.channel => (section, i.e.: Video)
		s.prop1 => Site Section Level 2 (section, i.e.: Video)
		s.prop2 => Site Section Level 3 (sub-sub-section - example: Video:Greatest Wipeouts)
		s.prop3 => UserType
		s.prop4 => UserID	//what to use for this?
		s.prop5 => Full URL	//what to use for this?
		s.prop6 => Report Area
		s.prop7 => Report Region
		s.prop8 => Report SubRegion
		s.prop9 => Report Spot
		s.prop10 => Device Type*/

		options = _.defaults(options || {},{
			pageName:"default",
			prop3: (Surfline.User.premiumAccount?'premium-account':'non-premium'),
			prop4: (Surfline.User.customerId?Surfline.User.customerId:'no-customer-id'),
			prop10: TVEngine.getPlatform().deviceType(),
		});

		var s_account="sflnctv"
		var s=s_gi(s_account);

		s.linkTrackEvents 	= "None";
		s.linkTrackVars 	= _.keys(options).join(',');

		//setup the other parts
		var str = '';
		_.each(options,function(val,key){
			s[key] = val;
			str = str + key + ':' + val + ' '; 
		});

		//$log('ominiture just called with the following data => ' + str);

		var s_code = s.t();


	}
}