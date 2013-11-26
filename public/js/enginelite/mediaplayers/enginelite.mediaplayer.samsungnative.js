/* globals PLR_FALSE, alert */
define(['jquery', 'underscore', 'backbone', 'tvengine', 'enginelite/enginelite.mediaplayer', 'platform', 'domReady'], function($, _, Backbone, TVEngine, MediaPlayer, Platform, domReady) {

	var error_reporter = function() {
		return function(err) {
			this.videoError(err);
		}
	}
	

	var SamsungNative = {
		plugin: null,
		audioPlugin: null,
		state: -1,
		skipState: -1,
		stopCallback: null,
		/* Callback function to be set by client */
		originalSource: null,
		streamready: false,
		allowFastForward: true,

		STOPPED: 10,
		PLAYING: 11,
		PAUSED: 12,
		FORWARD: 13,
		REWIND: 14,
		userBitrate: null,
		_active: false,
		active: function() {
			this._active = true
		},
		deactive: function() {
			this._active = false
		},

		currentInfoDefaults: {
			duration: "unknown",
			height: "unkown",
			width: "unknown"
		},

		currentInfo: {}, 

		init: function() {
			var success = true;
			this.state = this.STOPPED;
			this.plugin = document.getElementById("pluginPlayer");
			this.audioPlugin = document.getElementById("pluginAudio");
			if (!this.plugin) {
				// console.log(" Could not find video plugin ")
				return false;
			} else {
				var mwPlugin = document.getElementById("pluginTVMW");
				if (!mwPlugin) {
					success = false;
				} else if (mwPlugin.GetSource && mwPlugin.SetMediaSource()) {
					/* Save current TV Source */
					this.originalSource = mwPlugin.GetSource();
					/* Set TV source to media player plugin */
					mwPlugin.SetMediaSource();
				}
			}
			// console.log(this.plugin)

			// Reset Platform to default sets.
			// console.log("Resetting Coordinates");
			//this.setCoordinates(0,0,TVEngine.getPlatform().resolution.width, TVEngine.getPlatform().resolution.height);
			this.setCoordinates(0, 0, 960, 540);
			this.plugin.OnAuthenticationFailed = 'TVEngine.MediaPlayer.errorAuthFailed';
			this.plugin.OnBufferingComplete = 'TVEngine.MediaPlayer.bufferingComplete';
			this.plugin.OnBufferingProgress = 'TVEngine.MediaPlayer.bufferingProgress';
			this.plugin.OnBufferingStart = 'TVEngine.MediaPlayer.bufferingStart';
			this.plugin.OnConnectionFailed = 'TVEngine.MediaPlayer.errorConnFailed';
			this.plugin.OnCurrentPlayTime = 'TVEngine.MediaPlayer.currentPlayTime';
			this.plugin.OnNetworkDisconnected = 'TVEngine.MediaPlayer.errorNetDFailed';
			this.plugin.OnRenderError = 'TVEngine.MediaPlayer.errorRender';
			this.plugin.OnMute = "TVEngine.MediaPlaye.Events.muted";
			this.plugin.OnRenderingComplete = "TVEngine.MediaPlayer.streamEnded";
			this.plugin.OnStreamInfoReady = 'TVEngine.MediaPlayer._streamInfoReady';
			this.plugin.OnStreamNotFound = 'TVEngine.MediaPlayer.streamNotFound';
			return success;
		},

		errorAuthFailed: error_reporter("auth failed"),
		errorConnFailed: error_reporter("connection failed"),
		errorNetDFailed: error_reporter("network disconnected"),
		errorRender: error_reporter("rendering failed"),

		setCurrentIndex: function(index) {
			if (this.playlist) {
				this.playlist.setCurrentIndex(index);
			}
		},

		error_reporter: function(err) {
			this.videoError(err)
		},

		play: function() {
			this.active();
			if (!this.currentStreamUrl) {
				this.nextVideo();
			} else {
				if (this.state == this.PLAYING) {
					this.pause();
				} else if (this.state == this.PAUSED) {
					if (!this.plugin.Resume()) {
						this.videoError("FAILED TO RESUME STREAM");
						this.state = this.PLAYING;
						return false;
					} else {
						this.state = this.PLAYING;
						this.trigger("onresume");
						return true;
					}
				} else {
					this.nextVideo();
				}
			}
		},

		_playVideo: function(url, offset) {
			if (typeof url !== 'string') {
				$error("_playVideo: url must be a string, was:" + typeof url);
			}

			offset = _.isNumber(offset) ? offset : 0;
			this.currentVideoUrl = url;
			this.plugin.Stop();
			this.streamready = false;


			if (url.toString().match(/\.m3u8/i)) {
				url = url + "|COMPONENT=HLS";
			}

			console.log(" PLAYING URL ", url);
			var self = this;

			function play(url, offset) {
				if (_.isArray(url)) {
					$error("url was an array");
					url = url[0];
				}
				if (typeof url !== 'string') $error("url must be a string, was " + (typeof url));
				console.log("about to play = ", [url, offset]);
				return self.plugin.ResumePlay(url, offset);
			}

			try {
				if (play(url, offset)) {
					this.trigger("play videoup", this.playlist.currentItem);
					this.state = this.PLAYING;
				} else {
					this.videoError("FAILED TO START STREAM");
					this.state = this.STOPPED;
				}
			} catch (e) {
				$error("play video error: ", e);
			}
		},

		jumpToTime: function(time) {
			if (this.durationInSec() && time >= this.durationInSec() - 5) time = Math.floor(this.durationInSec()) - 5;
			if (time < 0) time = 0;

			var difference = Math.floor(time - this.currentTimeInSec());
			this.jump(difference);
		},

		// Controls
		stop: function() {
			this.state = this.STOPPED
			if (this.plugin) {
				console.log(this.plugin);
				console.log(" Calling MediaPlayer Stop ")
				this.plugin.Stop();
				this.plugin.ClearScreen();
				this.currentStream = null;
				this.trigger('onstop videodown');
			}
		},



		pause: function() {
			this.trigger("onpause videodown");
			if (this.plugin) this.plugin.Pause();
			this.state = this.PAUSED;
		},

		fastforward: function() {
			if (this.allowFastForward) {
				this.trigger("onfastforward");
				this.plugin.JumpForward(5);
			}
		},

		jump: function(amount) {
			if (!this.allowFastForward) return;
			amount = _.isNumber(amount) ? amount : 5;
			if (amount > 0) {
				this.plugin.JumpForward(amount);
			} else if (amount < 0) {
				this.plugin.JumpBackward(-amount);
			}
		},

		rewind: function() {
			this.trigger("onrewind");
			this.plugin.JumpBackward(5);
		},

		mute: function() {
			var currentMute = this.audioPlugin.GetSystemMute();
			this.audioPlugin.SetSystemMute(currentMute == PLR_FALSE);
			TVEngine.MediaPlayer.trigger("onmute", !currentMute);
		},

		setCoordinates: function(x, y, width, height) {
			if (this.plugin.SetDisplayArea) {
				this.plugin.SetDisplayArea(x, y, width, height);
			}
		},

		playing: function() {
			return (this.state == this.PLAYING);
		},



		duration: function() {
			if (this.streamready) {
				return this.plugin.GetDuration();
			} else {
				return null;
			}
		},

		durationInSec: function() {
			if (this.streamready) {
				return Math.floor(this.plugin.GetDuration() / 1000)
			} else {
				return null;
			}
		},

		// Events

		onDone: function() {
			if (this.loop) this.play();
			else this.videoUrl = null;
		},



		shutdown: function() {
			this.stop();
			var mwPlugin = document.getElementById("pluginTVMW");
			if (mwPlugin && (this.originalSource !== null)) {
				mwPlugin.SetSource(this.originalSource);
				alert("Restore source to " + this.originalSource);
			}
		},

		currentTime: function() {
			//console.log('currentTIme in samsungNative = ', this._ct);
			return this._ct;
		},

		currentTimeInSec: function() {
			return Math.floor(this._ct / 1000);
		},

		videoError: function(message, type) {
			console.log(" `OR: ", message, ' for ', type);

			// Samsung native player throws an error on videos that don't contain audio stream
			// This is expected, we don't want to bail on it.
			if (!this.playlist.videosContainsAudio && message === '3' && type === 'rendering failed') {
				console.log('we are avoiding the rendering failed error for samsung audio error');
				return;
			}


			var args = Array.prototype.slice.call(arguments, 0);
			args.unshift("videoerror videodown");
			this.trigger.apply(this, args);
			this.nextVideo();
		},

		bufferingStart: function() {
			this.trigger("bufferingstart");
		},
		bufferingProgress: function(progress) {
			console.log("buffering progress", progress);
			this.trigger("bufferingprogress", progress)
		},
		bufferingComplete: function() {
			console.log("buffering end");
			this.trigger("bufferingend");
		},

		currentPlayTime: function(currentTime) {
//			console.log(" CURRENT PLAY TIME UPDATE ", currentTime);
			this._ct = parseInt(currentTime, 10);
			this.trigger("timeupdate", currentTime);
		},
		streamEnded: function() {
			console.log(" STREAM ENDED ", this);
			this.trigger("videoend videodown");
			this.nextVideo();
			console.log('after nextVideo is fired');
		},
		muted: function(mute) {
			this.trigger("muted", mute);
		},
		_streamInfoReady: function() {
			// console.log("Stream info ready: " +  Array.prototype.slice.call(arguments, 0).join("\n ") );
			this.streamready = true;
			this.trigger("streaminfoready")
		},
		streamNotFound: function() {
			// console.log(" STREAM NOT FOUND ");
			this.trigger("videoerror videodown", "stream not found");
		}
	}
	// unfortunately in this case we need to pollute the TVEngine namespace
	//  so Samsung can have its call backs.
	domReady(function() {
		var pluginAPI = new window.Common.API.Plugin();
        // Done in start instead of init() b/c mediaplayer is not loaded until after init().
        
        $("#videoDebug").append($('<div>domReady launched, setting screensaver to on<div>'))
        pluginAPI.setOnScreenSaver();

        MediaPlayer.bind('videoup',function(){
        	$("#videoDebug").append($('<div>videoup triggered - setting screensaver to off<div>'))
        	pluginAPI.setOffScreenSaver();
        });

        MediaPlayer.bind('videodown',function(){
        	$("#videoDebug").append($('<div>videodown triggered -setting screensaver to on<div>'))
        	pluginAPI.setOnScreenSaver();
        });

        /*MediaPlayer.bind('mediaplayer:onplay', function() {
            //$rlog('got an event mediaplayer:onplay');
            pluginAPI.setOffScreenSaver();
        });
        MediaPlayer.bind('mediaplayer:onresume', function() {
            //$rlog('got an event mediaplayer:onresume');
            pluginAPI.setOffScreenSaver();
        });
        MediaPlayer.bind('mediaplayer:onpause', function() {
            //$rlog('got an event mediaplayer:onpause');
            pluginAPI.setOnScreenSaver();
        });
        MediaPlayer.bind('mediaplayer:onstop', function() {
            //$rlog('got an event mediaplayer:onstop');
            pluginAPI.setOnScreenSaver();
        });
        MediaPlayer.bind('mediaplayer:mediaend', function() {
            //$rlog('got an event mediaplayer:mediaend');
            pluginAPI.setOnScreenSaver();
        });*/
	});
	$(window).bind('unload', function() {
	    try {
	        MediaPlayer.stop();
	    } catch (e) {
	        console.error(' ON UNLOAD RESET CALLED BUT ERRORED!', e);
	    }
	});
	_.extend(MediaPlayer, SamsungNative);
	TVEngine.MediaPlayer = MediaPlayer;
	window.TVEngine = TVEngine;
	return MediaPlayer;
});