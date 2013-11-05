// HTML 5 Video tag Media Player
// Note these are all
define(['enginelite/enginelite.mediaplayer', 'platform', 'jquery','underscore'], function(MediaPlayer, Platform, $, _) {
  var videotag = {
    _active: false,
    active: function() {
      this._active = true
    },
    deactive: function() {
      this._active = false
    },
    _videoElement: null,
    allowFastFoward: true,
    name: "Video Tag Module",
    currentCSS: null,

    init: function() {
      $log(" VIDEO TAG INIT ");
      // TODO: Need a cleaner way to handle the parents init handler;
      this._videoElement = $("video:first")[0];
      if (!this._videoElement) {
        var obj = this._createVideoTag();
        obj.trigger("videotagadded");
      } else {
        this._trackEvents();
      }
    },
    _buildCount: 0,

    _createVideoTag: function() {
      $log(" CREATE VIDEO TAG PLEASE  !!!! ");
      this.eventsBound = false;
      $(this._videoElement).remove();
      var obj = $("<video></video>", {id:"videoelm", 'data-build':this._buildCount++});
      $("#videotag").append(obj);
      obj.hide();
      this._videoElement = obj[0];
      //setTimeout(function(){$("video").prop('muted', false)},1000);
      //if(this.currentMute) obj.attr('muted', 'muted');
      this._trackEvents();
      if (_.isObject(this.currentCSS)) $(this._videoElement).css(this.currentCSS);
      return obj;
    },

    _createAudioTag: function() {
      if (!$("#vt-audioplayer").length) {
        $("body").append($("<audio></audio>", {
          id: "vt-audioplayer"
        }));
      }
    },

    playAudio: function(stream) {
      this._createAudioTag();
      $("#vt-audioplayer")[0].pause();
      $("#vt-audioplayer").attr('src', stream);
      try {
        $("#vt-audioplayer")[0].play();
      } catch (e) {
        $log("Error playing audio: " + stream + " Error: " + e);
      }
    },

    stopAudio: function() {
      if ($("#vt-audioplayer").length) {
        $("#vt-audioplayer")[0].pause();
      }
    },


    //we are runninginto a problem here duration is in ms because it calls the native players duration
    //time paramater in seconds...
    //this._videoElement.currentTime needs seconds...
    //so we will need ot convert duration to ms.
    jumpToTime: function(time) {
      $log(" JUMPING TO TIME ", time)
      if (this.durationInSec() && time >= this.durationInSec() - 2) time = Math.floor(this.durationInSec()) - 2;
      if (time <= 0) time = 0;
      this._videoElement.currentTime = time;
      //this._videoElement.play();
    },

    play: function() {
      // $log("Playing Media", this.playlist);
      // $log(" PLAYING MEDIA ", this.currentStreamUrl );
      if (!this.playlist) {
        $error(" Can't press play on a mediaplayer without a playlist")
        return;
      }
      this.active();
      if (this._videoElement && this.currentStreamUrl === null) {
        $log(" Playing Next File ")
        this._trackEvents();
        this.nextVideo();
      } else if (this._videoElement) {
        if (this._videoElement.paused) {
          $log(" Calling Video Element Play");
          this._videoElement.play();
        } else {
          $log(" Calling Video Element Pause ")
          this._videoElement.pause();
        }
      }
    },

    _playVideo: function(url, index) {
      $log(" SETTING CURRENT STREAM TO: " + url, url);
      this.stop(true);
      $(this._videoElement).attr('autoplay', 'play');
      $(this._videoElement).attr('src', url);
      //$(this._videoElement).attr('muted',true);     //not sure why we were doing this?
      $(this._videoElement).show();
      if (_.isNumber(index)) {
        this._videoElement.loaded = false;
        this._videoElement.addEventListener('loadedmetadata', function() {
          $log(" VIDEO ELEMENT LOADED TRYING TO SET CURRENT TIME ", this.loaded, index);
          if (!this.loaded) {
            $log(" SETTING CURRENT TIME TO ", index);
            this.currentTime = index;
            this.loaded = true;
          }
        }, false);
      }

      this._loadedTime = 0;
      this._videoElement.load();
      // this._videoElement.play();
      this.wasMuted = this._videoElement.muted;
    },

    stop: function(forced) {
      if (this._videoElement) {
        $log(" RECREATING VIDEO ELEMENT!");
        try {
          $(this._videoElement).unbind();
          $(this._videoElement).remove();
          this._createVideoTag();
          this.currentStream = null
          if (!forced) this.trigger("onstop videodown");
        } catch (e) {
          $error(" STOP ERROR " + e);
          $log(e);
        } // If this doesn't succeed, it doesn't matter, just die gracefully

      }
    },

    pause: function() {
      // May get called without the correct initialization, so wrapping in block.
      // This should always fail gracefully.
      try {
        $(this._videoElement).removeAttr('autoplay');
        this._videoElement.pause();
        this.trigger("onpause, videodown");
      } catch (e) {
        $log(" FAILED TO PAUSE VIDEO: " + e);
      }
    },

    fastforward: function() {
      if (!this.allowFastFoward) return;
      if (!this._videoElement.paused && this._videoElement.playbackRate != 1) {
        this._videoElement.playbackRate = 1;
      } else {
        this._videoElement.play();
        this._videoElement.playbackRate = 3;
      }
      this.trigger("onfastforward");
    },
    rewind: function() {
      if (!this._videoElement.paused && this._videoElement.playbackRate != 1) {
        this._videoElement.playbackRate = 1;
        this.trigger("onrewind", 1);
      } else {
        this._videoElement.play();
        this._videoElement.playbackRate = -3;
        this.trigger("onrewind", -3);
      }
    },

    jump: function(amount) {
      if (!this.allowFastFoward) return;

      var ct = this._videoElement.currentTime;
      if (ct + amount < 0) {
        this._videoElement.currentTime = 0;
      } else if (ct + amount > this._videoElement.duration) {
        this._videoElement.currentTime = this._videoElement.duration;
      } else {
        this._videoElement.currentTime = this._videoElement.currentTime + amount;
      }

    },

    mute: function(muted) {
      $log(" MUTING? ", this._videoElement);
      if (this._videoElement) {
        $log(" GOT VIDEO ELEMENT ")
        // need to hold on to this so we know when we've switched state in our onvolumechange handler.

        $(this._videoElement).attr('muted', muted);
      }
      this.currentMute = muted;
    },


    setCoordinates: function(x, y, width, height, z) {
      var css = {
        left: x,
        top: y,
        width: width,
        height: height
      }
      if (_.isNumber(z)) _.extend(css, {
        zIndex: z
      });
      $(this._videoElement).css(css);
      this.currentCSS = css;
    },
    currentTime: function() {
      return this._videoElement.currentTime * 1000;
    },

    playing: function() {
      return (this._videoElement.paused) ? false : true;
    },


    duration: function() {
      if (_.isNaN(this._videoElement.duration)) {
        return null;
      } else {
        return Math.floor(this._videoElement.duration * 1000);
      }
    },

    durationInSec: function() {
      if (_.isNaN(this._videoElement.duration)) {
        return null;
      } else {
        return this._videoElement.duration;
      }
    },

    setVideoElement: function(element) {
      this._videoElement = $(element);
    },
    _eventsToTrack: ['loadstart', 'ended', 'timeupdate', 'play', 'pause', 'loadstart', 'timeupdate', 'error', 'loadeddata', 'volumechange', 'duration'],
    wasMuted: false,

    _testing: function() {
      // $log(" HERE WE TEST ");
    },
    _trackEvents: function() {
      if (this.eventsBound) return;
      $(this._videoElement).unbind();
      $(this._videoElement).bind(this._eventsToTrack.join(" "), $.proxy(this._eventHandler, this));
      $(this._videoElement).on('ended', function() {
        $log("VIDEO ELEMENT ENDED " + this.src);
      })
      this.eventsBound = true;
    },

    _eventHandler: function(e) {
      if (e.type != 'timeupdate') $log(e.type);
      var _t = this;
      switch (e.type) {
        case 'timeupdate':
          //$log('timeupdate = ', Math.round(e.currentTarget.currentTime * 1000));
          this.trigger("timeupdate", Math.round(e.currentTarget.currentTime * 1000));
          break;
        case 'loadstart':
          this.trigger("bufferingstart");
          break;
        case 'loadeddata':
          this.trigger("bufferingend");
          break;
        case 'ended':
          $log(" Video Ended AND THE CURRENT TIME IS = ", _t.currentTime())
          this.trigger("videoend videodown", _t.playlist.currentItemIndex);
          var delay = (Platform.name == "lg") ? 1250 : 0;
          _.delay(function() {
            _t.nextVideo();
          }, delay)
          break;
        case 'play':
          this.trigger("play videoup", _t.playlist.currentItemIndex);
          break;
        case 'pause':
          this.trigger("pause");
          break;
        case 'error':
          $log(" ERROR HAS BEEN FIRED ", _.keys(e.originalEvent));
          this.trigger("videoerror videodown", e);
          //this.nextVideo();
          break;
        case 'volumechange':
          $log(" VOLUME CHANGE EVENT ");
          if (_t.wasMuted != this.muted) {
            this.trigger("muted");
          }
          this.trigger("volumechange", e.currentTarget.volume);
          break;
      }
    },

    _stopTrackingEvents: function() {
      $(this._videoElement).unbind(this.eventsToTrack, this._eventHandler);
      this.eventsBound = false;
    }
  }
  _.extend(MediaPlayer, videotag);
  return MediaPlayer;
});