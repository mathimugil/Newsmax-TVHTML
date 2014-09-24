/* global VideoAd */
define(['enginelite/enginelite.platform', 'jquery', 'underscore', 'backbone', 'domReady', 'tvengine'], function(Platform, $, _, Backbone, domReady, TVEngine) {

    var platform = new Platform('lg');
    platform.setResolution(1280, 720);
    platform.needsProxy = true;
    platform.keys = function() {
        return {
            KEY_RETURN: 36,
            KEY_UP: 38,
            KEY_DOWN: 40,
            KEY_LEFT: 37,
            KEY_RIGHT: 39,
            KEY_ENTER: 13,
            KEY_RED: 65,
            KEY_GREEN: 66,
            KEY_YELLOW: 67,
            KEY_BLUE: 68,
            KEY_BACK: 461,
            KEY_PLAY: 415,
            KEY_PAUSE: 19,
            KEY_FF: 417,
            KEY_RW: 412,
            KEY_STOP: 413
        }
    };
    platform.exitToTv = function() {
        window.NetCastExit();
    };

    platform.exitToMenu = function() {
        window.NetCastBack();
    };

    TVEngine.on('exittomenu', function() {
        platform.exitToMenu();
    }, platform)

    TVEngine.on('exit', function() {
        platform.exitToTv();
    }, platform)


    platform.adPlayer = {
        _ad: null,
        _deferred: null,

        init: function() {
            $("<script />", {
                src: "http://smartservice.lgappstv.com/library/apps/ad/lib/videoAd.js",
                type: 'text/javascript'
            }).appendTo("head");


            try {
                this.ad = new VideoAd("videotag", "videoelm", this._eventCallbacks);
            } catch (e) {
                $log(" FAILED TO CREATE VIDEO AD " + e);
            }
        },

        play: function() {
            this.init();
            try {
                if (this._deferred) this._deferred.resolve(false);
                this._deferred = new $.Deferred();
                this.ad.startPreroll();
                return this._deferred;
            } catch (e) {
                $log(" AD FAILED ")
            }
        },
        pause: function() {
            this.ad.pause();
        },
        remove: function() {
            this.ad.removeAd();
        },
        _eventCallbacks: function(e) {
            var MediaPlayer;
            switch (e) {
                case 'ad_completed':
                    platform.adPlayer._deferred.resolve(true);
                    if (require.defined('enginelite/enginelite.mediaplayer')) {
                        MediaPlayer = require("enginelite/enginelite.mediaplayer")
                        MediaPlayer.trigger('vastPrerollDone');
                    }
                    break;
                case 'ad_present':
                    if (require.defined('enginelite/enginelite.mediaplayer')) {
                        MediaPlayer = require('enginelite/enginelite.mediaplayer');
                        MediaPlayer.trigger('vastPrerollStart');
                    }
                    break;
            }
        }
    }

    _.extend(platform.adPlayer, Backbone.Events);

    platform.deviceId = function() {
        try {
            var device = document.getElementById('lg-device');
            return device.serialNumber;
        } catch (e) {
            window.console.log(" Error with device id");
        }
    }

    platform.deviceType = function() {
        return device.manufacturer + "  - " + device.modelName;
    }

    platform.uid = function() {
        var device = document.getElementById("device");
        return window.btoa(this.deviceType + " - " + device.serialNumber);
    }
    return platform.start();
});