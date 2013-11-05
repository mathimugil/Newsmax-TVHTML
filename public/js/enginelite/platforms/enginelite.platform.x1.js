define(['enginelite/enginelite.platform'], function(Platform)  {

    var platform = new Platform('x1');
    platform.setResolution(1280, 720);
    platform.needsProxy = true;
    platform.cssFiles = [];



    platform.deviceId = function() {
        var saved_did = localStorage.getItem("ade.deviceid");
        if(!saved_did) {
            saved_did = this.__generateDeviceId();
            localStorage.setItem("ade.deviceid", saved_did);
        }
        return saved_did;
    }

    platform.deviceType = function() {
        return navigator.appCodeName + " - " + navigator.appName;
    }

    platform.__generateDeviceId = function() {
        // Note no guarantee this is actually unique.
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    platform.__clearDeviceId = function() {
        localStorage.removeItem("ade.deviceid");
    }
    return platform.start();
});