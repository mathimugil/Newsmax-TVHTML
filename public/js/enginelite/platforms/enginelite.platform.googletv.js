define(['enginelite/enginelite.platform'], function(Platform)  {

    var platform = new Platform('googletv');
    platform.setResolution(1280, 720);
    platform.needsProxy = true;
    platform.detectPlatform = function() {
        $log("this ran?");

        if(navigator.userAgent.search(/GoogleTV/) > -1) {
            if(screen.width > 720) {
                $(function() {
                    var w = screen.width, h = screen.height;
                    var wr = w / 1280;
                    var hr = h / 720;
                    var ratio = (wr + hr) / 2;
                    $("body").css('zoom', ratio);
                    var count = 0;
                    var interval = setInterval(function() {
                       $("body").css('zoom', ratio);
                       if(count++ == 5) clearInterval(interval);
                    }, 500);
                });


            } else {
                var xoffset = Math.floor((screen.width - 1280) / 2);
                var yoffset = Math.floor((screen.height - 720) / 2);
                $("#innerBody").css({
                    left: "+=" + xoffset,
                    top: "+=" + yoffset
                })
            }
            return true;
        }
    }

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

    platform.keys = function() {
      return {
        KEY_UP: 38,
        KEY_DOWN: 40,
        KEY_LEFT: 37,
        KEY_RIGHT: 39,
        KEY_ENTER: 13,
        KEY_BACK: 8,
        KEY_PLAY: 179,
        KEY_RW:227,
        KEY_FF:228,
        KEY_STOP:178,
        KEY_SKIPFW:177,
        KEY_SKIPBACK:176
      }
    }
    return platform.start();
});