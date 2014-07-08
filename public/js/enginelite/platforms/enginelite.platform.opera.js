/* global VideoAd, $debug */
define(['enginelite/enginelite.platform', 'tvengine'], function(Platform, TVEngine)  {
  var platform = new Platform('opera');
  platform.setResolution(1280, 720);
  platform.detectPlatform = function() {
    if (navigator.userAgent.search(/Opera TV Store/) > -1) {
      return true;
    }
  }
  platform.needsProxy = true;
  platform.init = function(){
    TVEngine.on('exittomenu', function() {
            this.exitToMenu();
        },this);
  }
  platform.exitToTv = function() {
    window.close();
  };

  platform.exitToMenu = function() {
    window.close();
  };
  platform.keys = function() {
    return {
      KEY_RETURN: VK_BACK_SPACE,
      KEY_UP: 38,
      KEY_DOWN: 40,
      KEY_LEFT: 37,
      KEY_RIGHT: 39,
      KEY_ENTER: 13,
      KEY_RED: VK_RED,
      KEY_GREEN: VK_GREEN,
      KEY_YELLOW: VK_YELLOW,
      KEY_BLUE: VK_BLUE,
      KEY_BACK: VK_BACK_SPACE,
      KEY_PLAY: 415,
      KEY_PAUSE: 19,
      KEY_FF: 417,
      KEY_RW: 412,
      KEY_STOP: 413 
    }
  }



  platform.adPlayer = {
    _ad: null,
    _deferred: null,

    init: function() {
      try {
        this.ad = new VideoAd("videotag", "videoelm", this._eventCallbacks);
        /*this.ad = new VideoAd("videotag", "videoelm", function(e){
          $('#errorField').text('got something back ' + e);
        });*/
      } catch (e) {
        $log(" FAILED TO CREATE VIDEO AD " + e);
      }
    },
    count:0,
    play: function() {
      this.init();
      try{
        if(this._deferred) this._deferred.resolve(false);
        this._deferred = new $.Deferred();
        $log('---- STARTING OPERA PRE ROLL...... -----');
        this.ad.startPreroll();
        var self = this;
        //debug code
        
        return this._deferred;
      } catch(e) {
        $log(" AD FAILED ")
      }
    },
    pause: function() {
      this.ad.pause();
    },
    remove: function() {
      this.ad.removeAd();
    }
  }

  _.extend(platform.adPlayer, Backbone.Events);

  platform.deviceId = function() {
    var saved_did = $storage.getItem("ade.deviceid");
    if(!saved_did) {
      saved_did = this.__generateDeviceId();
      $storage.setItem("ade.deviceid", saved_did);
    }
    return saved_did;
  }

  platform.deviceType = function() {
    return navigator.appCodeName + " - " + navigator.appName;
  }

  platform.uid = function() {

  }

  platform.__generateDeviceId  = function() {
    // Note no guarantee this is actually unique.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  platform.__clearDeviceId = function() {
    $storage.removeItem("ade.deviceid");
  }

  platform.init();
  return platform.start();
});