function extractPlatformInfo(Platform) {
	// Get platform info but don't go crazy trying to recognize everything
	// that's out there.  This is just for the major platforms and OSes.	  
	var platform = Platform.name, ua = navigator.userAgent;

	 // Detect OS 
	var oses = ['Windows','iPhone OS','(Intel |PPC )?Mac OS X','Linux'].join('|');
	var pOS = new RegExp('((' + oses + ') [^ \);]*)').test(ua) ? RegExp.$1 : null;
	if (!pOS) pOS = new RegExp('((' + oses + ')[^ \);]*)').test(ua) ? RegExp.$1 : null;

	// Detect browser	  
	var pName = /(Chrome|MSIE|Safari|Opera|Firefox)/.test(ua) ? RegExp.$1 : null;

	// Detect version  
	var vre = new RegExp('(Version|' + pName + ')[ \/]([^ ;]*)');
	var pVersion = (pName && vre.test(ua)) ? RegExp.$2 : null;

	// Detect DeviceID
	var deviceID = Platform.deviceId();
	
	var platformInfo = {
		platform: platform,
		pos:pOS,
		pversion:pVersion,
		deviceid:deviceID 
	}; 	
	return platformInfo;
}

function getCurrentTimeString() {
	var currentdate = new Date(); 
	var datetime = currentdate.getUTCDate() + "_"
				+ (currentdate.getUTCMonth()+1)  + "_" 
				+ currentdate.getUTCFullYear() + "__"  
				+ currentdate.getUTCHours() + "_"  
				+ currentdate.getUTCMinutes() + "_" 
				+ currentdate.getUTCSeconds() + "_"	
				+ currentdate.getUTCMilliseconds();		
	return datetime;
}
