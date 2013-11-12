define(['jquery', 'underscore', 'backbone', 'tvengine', 'domReady'], function($, _, Backbone, TVEngine, domReady) {

  var $noop = function() {};

  var Platform = function(name) {
    this.name = name;
    this.defaultPlatform = false;
    this._mediaPlayer = "videotag";
    this.start = $noop;
    this.exit = $noop;
    this.logger = null, this._keys = {
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
      KEY_BACK: 8,
      KEY_PLAY: 80
    };
    // this.resolution = {
    //   height: 540,
    //   width: 960
    // }
    this.resolution = {
      height: 720,
      width: 1280
    };

    this.start = function() {

      $log("<< PLATFORM IS: (" + this.name + ") >>")
      var _t = this;
      this.addPlatformCSS();


      // Going to add our proxy adding an ajax prefilter to switch to route the url
      // through a proxy for cross domain requests.

      if (_.isFunction($.ajaxPrefilter)) {
         $.ajaxPrefilter(function(options, originalOptions) {
          var data = originalOptions.data || {};
          var proxypath = options.proxypath || 'proxy.api';
          if (!options.skipProxy && data.dataType !== "jsonp" && options.url.indexOf("http") === 0) {
            options.url = options.url.replace(/^[^#]*?:\/\/.*?(\/.*)$/, "/"+proxypath+"$1");
          }
        });
      }

      domReady(function() {
        $("*[data-platform]").not("[data-platform*='" + _t.name + "']").remove();
      });

      return this;
    }



    // Might want to set this to something different
    this.needsProxy = true;
    _.extend(this, Backbone.Events);
  }

  Platform.prototype.deviceId = function() {
    return "No Device ID Method set for " + this.name;
  }
  Platform.prototype.deviceType = function() {
    return "No Device Type method set for " + this.name;
  }

  Platform.prototype.uid = function() {
    return (this.deviceType() + this.deviceId()).replace(" ", "");
  }

  // override this if necessary
  Platform.prototype.keys = function() {
    return this._keys;
  }
  Platform.prototype.setMediaPlayer = function(mediaplayer) {
    this._mediaPlayer = mediaplayer;
  }


  Platform.prototype.cleanAppVersion = function() {
    var version = navigator.appVersion.match(/^[^\s]*/)[0] || null;
    if (version === null) return null;
    var split = version.split(".")
    return {
      major: split[0],
      minor: split[1],
      mod: split[2]
    }
  };

  Platform.prototype.setResolution = function(width, height) {
    if (width.toString().indexOf("x") > 1) {
      var splits = width.split("x");
      width = splits[0];
      height = splits[1];
    }
    this.resolution.height = height;
    this.resolution.width = width;
  }

  Platform.prototype.matrix = function() {
    return this.resolution.width + "x" + this.resolution.height;
  }

  Platform.prototype.addPlatformCSS = function() {
    var files = _.isString(this.cssFiles) ? [this.cssFiles] : _.isArray(this.cssFiles) ? this.cssFiles : [];
    _(files).each(function(f) {
      $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        href: "css/platforms/" + f + ".css"
      }).appendTo("head");
    });
  }

  Platform.prototype.proxy = function(url) {
    if (TVEngine.config.corsEnabled && TVEngine.config.corsWhitelisted) return "";
    url = url || "";
    if (this.needsProxy) {
      return "proxy.php?url=" + url.trim() + "&send_cookies=1&send_session=1&mode=native";
    } else {
      return url;
    }
  }

  Platform.prototype.setLogger = function(l) {
    this.logger = l
  }
  return Platform;
});
