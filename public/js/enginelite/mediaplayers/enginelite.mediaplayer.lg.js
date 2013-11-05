/*
VIDEO WRAPPER FOR CUSTOM LG OBJECT VIDEO PLAYER
Currently, this is tested for Surfline's HLS streams and the demo mp4 streams in video.json.
Seeking is available within the mp4 video, with limited accuracy.
Fastforward and rewind ARE UNAVAILABLE (object.isScannable returns false)
There are 3 events thrown.  I was not able to see buffer events operate correctly.  Error events came up with connectivity issues.  Play events were consistent.

Most documentation is available within the document
lg_web_open_api_reference_guide_v.2.5.4.pdf

*/
define(['jquery', 'underscore', 'enginelite/enginelite.mediaplayer', 'domReady'], function($, _, MediaPlayer, domReady) {

    var LGNativeMediaPlayer = {

        ps: {
            STOPPED: 0,
            PLAYING: 1,
            PAUSED: 2,
            CONNECTING: 3,
            BUFFERING: 4,
            FINISHED: 5,
            ERRORED: 6
        },
        _active: false,
        active: function() {
            this._active = true;
        },
        deactive: function() {
            this._active = false;
        },

        _videoElement: null,
        allowFastFoward: true,

        _timeTimeout: null,

        init: function() {
            this._videoElement = document.getElementById("video");
            if(!this._videoElement) {
                $("#videotag").html('<object type="application/x-netcast-av" id="video"  autoStart="true" width="1280px" height="720px"></object>');
                 this._videoElement = document.getElementById("video");
            }
            var _t = this;
            this._videoElement.onPlayStateChange = function() {
                _t.handlePlayState.call(_t, arguments);
            }

            this._videoElement.onBuffering = function() {
                _t.handleBufferState.call(_t, arguments);
            }

            this._videoElement.onError = function() {
                _t.handleErrorState.call(_t, arguments);
            }
            clearInterval(this._timeInterval);
            this._timeInterval = setInterval(function() {
                _t._checkTimePosition();
            }, 300)

        },


        _checkTimePosition: function() {
            var videoPlayInfo = this._videoElement.mediaPlayInfo();
            if (videoPlayInfo) {
                if ((this._videoElement.playState !== 5) && (this._videoElement.playState !== 0) && (this._videoElement.playState !== 2)) {
                    this.trigger("timeupdate", videoPlayInfo.currentPosition);
                }
            }
        },

        currentTime: function() {
            return this._videoElement.playPosition
        },

        play: function() {

            if (!this.playlist) {
                $error(" Can't press play on a mediaplayer without a playlist")
                return;
            }
            if (!this._active) {
                this.active()
            }
            if (this._videoElement && this.currentStreamUrl === null) {
                this.nextVideo();
            } else if (this._videoElement && this._videoElement.playState == this.ps.PAUSED) {

                this._videoElement.play(1);
                this.trigger("play", this.playlist.currentItemIndex);
            }
        },



        _playVideo: function(url, offset, options) {
            this._reset();
            if (_.isObject(offset))  options = offset;

            _.defaults(options, {});

            if (url) {
                if(options.wvm) this._setupWidevine(options.wvm);
                this._videoElement.data = url;
                this._videoElement.play(1);
                if (_.isNumber(offset) && !_.isNaN(offset)) {
                    this._jumpToOffset = Math.ceil(offset * 1000);
                } else {
                    this._jumpToOffset = null;
                }

            }
        },

        _setupWidevine:function(opts) {
            _.each(opts, function(value, key) {
                $log(" LOOKING FOR KEY ")
                if(_.isFunction(this._videoElement[setWidevine+key])) {
                    this._videoElement[setWidevine+key](value);
                } else {

                }
            })
        },


        stop: function(forced) {
            if (this._videoElement) {

                this._videoElement.play(0);
                if (!forced) this.trigger("onstop");
                // If this doesn't succeed, it doesn't matter, just die gracefully

            }
        },

        pause: function() {
            try {
                this._videoElement.pause();
                this.trigger("onpause");
            } catch (e) {
                // $log(" FAILED TO PAUSE VIDEO: " + e);
            }
        },


        fastforward: function() {
            var videoPlayInfo = this._videoElement.mediaPlayInfo();
            this.jump(Math.floor(videoPlayInfo.duration / 4000));
            this.trigger("onfastforward");
        },

        rewind: function() {
            var videoPlayInfo = this._videoElement.mediaPlayInfo();
            this.jump(Math.floor((videoPlayInfo.duration) / -4000));
            this.trigger("onrewind")
        },

        jump: function(amount) {
            var videoPlayInfo = this._videoElement.mediaPlayInfo();
            if (!_.isNumber(amount) || amount == 0) return;
            var destination = this._videoElement.playPosition + (amount * 1000);
            this.jumpToTime(destination/1000);
        },

        jumpToTime: function(destination) {
            destination = destination * 1000;
            $log(" JUMPING TO TIME ", destination);
            var videoPlayInfo = this._videoElement.mediaPlayInfo();
            $log(" JUMPING TO TIME ", destination, this._videoElement.playPosition, videoPlayInfo.duration );
            if (!_.isNumber(destination)) return;
            if (this._videoElement.playState !== 4 && this._videoElement.playState === 1 && this._videoElement.isSeekable) {
                if (destination >= videoPlayInfo.duration) {
                    this._videoElement.seek(videoPlayInfo.duration);
                } else if (destination < 0) {
                    this._videoElement.seek(0);
                } else {
                    this._videoElement.seek(destination);
                }
            }
        },




        setCoordinates: function(x, y, width, height) {
            $("#video").css({
                left: x,
                top: y,
                width: width,
                height: height
            })
        },

        playing: function() {
            if (this._videoElement === null) return false;
            var test = (this._videoElement.playState != 1) ? false : true;
            return test
        },


        duration: function() {
            if (_.isNaN(this._videoElement.mediaPlayInfo().duration)) {
                return null;
            } else {
                return Math.floor(this._videoElement.mediaPlayInfo().duration);
            }
        },


        handlePlayState: function() {
            $log(" HANDLE PLAY STATE: " + this._videoElement.playState);
            switch (this._videoElement.playState) {
                case 0:
                    this.trigger("stop");
                    break;
                case 1:
                    this.trigger("play", this.playlist.currentItemIndex());
                    break;
                case 2: //pause
                    this.trigger("pause");
                    break;
                case 3: //connecting
                    break;
                case 4: //buffering
                    this.trigger("bufferingstart");
                    break;
                case 5: //finished
                    this.trigger("videoend", this.playlist.currentItemIndex());
                    this.nextVideo();
                    break;
                case 6: //error
                    $(this._videoElement).remove();
                    this._createVideoTag();
                    this.trigger("videoerror");
                    break;
            }
        },

        handleBufferState: function() {
            var videoPlayInfo = this._videoElement.mediaPlayInfo();
            if (videoPlayInfo !== null) {
                this.trigger('bufferingend');
                if (_.isNumber(this._jumpToOffset) && !_.isNaN(this._jumpToOffset) && this._jumpToOffset > 0) {
                    var destination = this._jumpToOffset;
                    this.jumpToTime(this._jumpToOffset);
                    this._jumpToOffset = null;
                }
            } else if (this._videoElement.playState == 4) {
                this.trigger('bufferingstart');
            }
        },
        handleErrorState: function() {
            this.trigger("videoerror");
        },
        _reset: function() {
            if(!this._videoElement)  {
                this.init();
                return;
            }
            this._videoElement.onPlayStateChange = null;
            this._videoElement.onBuffering = null;
            this._videoElement.onError = null;
            this.eventsBound = false;
            $("#video").remove();
            this.init();
        }
    }
    _.extend(MediaPlayer, LGNativeMediaPlayer);
    return MediaPlayer;

});
