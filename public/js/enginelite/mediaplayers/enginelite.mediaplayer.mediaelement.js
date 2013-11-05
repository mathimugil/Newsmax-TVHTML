// HTML 5 Video tag Media Player
// Note these are all
define(['jquery', 'underscore', 'backbone', 'enginelite/enginelite.mediaplayer','domReady', 'lib/mediaelement-and-player'], function($,_,Backbone,MediaPlayer, domReady, MediaElementPlayer) {
  var tag = {
    _active: false,
    active: function() {
      this._active = true;
    },
    deactive: function() {
      this._active = false;
    },
    _mediaElement: null,
    _currentTime: null,
    _currentDuration: 0,
    _count: 0,

    _createNewPlayerElement: function(url) {
      var tag = $("<div/>", {
        id: 'player',
        preload: 'none',
        height: 720, width: 1280
      });
      tag.append($('<source/>').attr('type', 'video/mp4').attr('src', url));
      $("#videotag").append(tag);
      var _this = this;
      this._mediaElement = new MediaElementPlayer($("#player").get(0), {
        mode: 'shim',  // Forces Flash Mode.
        defaultVideoWidth: 1280, defaultVideoHeight: 720,
        pluginWidth: 1280, pluginHeight: 720,
        videoWidth: 1280, videoHeight: 720,
        timerRate: 1000,
        enableKeyboard: false, // Had some issues here when destroying the flash player
        alwaysShowControls: false,
        pluginPath: "plugins/",
        pauseOtherPlayers: false, // Had some issues here when destroying the flash player
        success: function success (mediaElement) {

          mediaElement.addEventListener('timeupdate', function() {
            _this._currentDuration = mediaElement.duration;
            _this._currentTime = mediaElement.currentTime * 1000;
            _this.trigger("timeupdate", mediaElement.currentTime * 1000);
          });

          mediaElement.addEventListener('ended', function() {
            _this.trigger("videoend videodown", _this.playlist.currentItemIndex);
            _this.stop();
            _this.nextVideo();
          });
          mediaElement.load();
          mediaElement.play();
        },
        // fires when a problem is detected
        error: function(e) {
          $log(" ERROR LOADING MEDIA ELEMENT ", e);
        }
      });
    },

    init: function () {
    },

    pause: function() {
      if (this._mediaElement && _.isFunction(this._mediaElement.pause)) {
        this._mediaElement.pause();
      } else {
        $log(" COULDN'T PAUSE ", this._player);
      }
    },

    play: function() {
      this.active();
      if (this.currentStreamUrl === null) {
        this.nextVideo();
      } else if (this._mediaElement) {
        this._mediaElement.play();
      }
    },

    _delay: null,

    _playVideo: function(url) {
      this.stop();
      clearTimeout(this._delay);
      var _t = this;
      this._delay = setTimeout(function() {
        _t._createNewPlayerElement(url);
      }, 1000);
    },

    stop: function() {
      if(this._mediaElement && _.isFunction(this._mediaElement.remove)) {
        this._mediaElement.remove();
      }
      delete this._mediaElement;
      this._mediaElement = false;
      $("#videotag").html('');
    },

    setCoordinates: function(x, y, width, height, z) {
      var css = {
        left: x,
        top: y,
        width: width,
        height: height
      };
      if (_.isNumber(z)) _.extend(css, {
          zIndex: z
        });
      $(this._mediaElement).css(css);
      this.currentCSS = css;
    },
    currentTime: function() {
      return this._mediaElement.currentTime * 1000;
    },

    playing: function() {
      return (this._mediaElement.paused) ? false : true;
    },


    duration: function() {
      if(_.isNumber(this._currentDuration)) return Math.floor(this._currentDuration * 1000);
      else return 0;
    }
  };
  $log(" EXTENDING MEDIA PLAYER ");
  _.extend(MediaPlayer, tag);
  return MediaPlayer;

});