define(['enginelite/enginelite.platform'], function(Platform) {
  var browser = new Platform('browser');
  browser.needsProxy = true;
  // We want this to fail, and get added as default
  browser.setResolution(1280, 720);

  browser.deviceId = function() {
    var saved_did = localStorage.getItem("ade.deviceid");
    if (!saved_did) {
      saved_did = this.__generateDeviceId();
      localStorage.setItem("ade.deviceid", saved_did);
    }
    return saved_did;
  }

  browser.deviceType = function() {
    return navigator.appCodeName + " - " + navigator.appName;
  }

  browser.__generateDeviceId = function() {
    // Note no guarantee this is actually unique.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  browser.__clearDeviceId = function() {
    localStorage.removeItem("ade.deviceid");
  }
  return browser.start();
});