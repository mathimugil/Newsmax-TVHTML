define([  'stagemanager'
          , 'navigation'
          , 'platform'
          , 'jquery'
          , 'underscore'
          , 'backbone'
          , 'mediaplayer'
          , 'keyhandler'
          , 'utils'
          , 'newsmax/menus/newsmax.menus.trickplay'], function(StageManager, Navigation, Platform, $, _, Backbone, MediaPlayer, KeyHandler, Util, TrickMenu) {


    var showLoader = function(){
      $("#circularG").fadeIn();
    }

    var hideLoader = function(){
      $("#circularG").fadeOut();
    }
	var scrubManager = {}, jumpingVideo = false;

	_.extend(scrubManager, Backbone.Events);

	_.extend(scrubManager, {
        step: 0,
        stepsize: 2,
        saveTimeout: null,
        _scrubbing:false,
        _currentScrubTime:null,
        _setJumpMode: function(){
            this._shouldUseJumpMode = false;
        },
        isUsingJumpMode: function(){
            return this._shouldUseJumpMode;
        },
        shouldScrub:true,
        scrubInterval:null,
        lockScrubbing:false,
        count:0,
        _jumpingVideo: false,
        stopStickyScrubbing: function(pausebutton) {
            this._stopScrubState();
            var _t = this;
            //var _pausebutton = pausebutton || false

            // if (_pausebutton !== false) {
            //     var self = this;
            //     var seconds, curTime, translated;
            //     curTime = this._currentScrubTime;
            //     translated = Util.convertMstoHumanReadable(curTime);
            //     seconds = translated.totalSeconds;
            //     _t.shouldScrub = true;
            //     clearTimeout(_t.scrubInterval);
            //     MediaPlayer.jumpToTime(seconds);
            //     MediaPlayer.pause();
            //     self.step = 0;
            //     self._scrubbing = false;
            //     self._stopScrubState();
            //     self.lockScrubbing = false;

            //     return;
            // }

            if (!_t._scrubbing) return;

            _t.shouldScrub = true;
            _t.lockScrubbing = true;

            clearTimeout(_t.scrubInterval);
            _t.trigger('stepset');
        },
        _rateControlInEffect: false,
        onRight:function() {
            // Rate Limit the button pressers.
            if(this._rateControlInEffect) return;
            this._rateControlInEffect = true;
            setTimeout(function() {
                this._rateControlInEffect = false;
            }.bind(this), 500)

            var _t = this;

            clearTimeout(this.saveTimeout);
            clearTimeout(this._stopScrubbingTimeout);
            if(this._jumpingVideo) {
                this._showFFOverlay();
                return;
            }

            this._delta = 1;
            if (_t.shouldScrub) {
                _t.shouldScrub = false;
                _t.scrubInterval =
                    setInterval(function() {
                    _t.trigger("newstep");
                }, 250);
            } else {
                _t.stopStickyScrubbing();
            }

        },
        onLeft:function(){
            if(this._rateControlInEffect) return;
            this._rateControlInEffect = true;
            setTimeout(function() {
                this._rateControlInEffect = false;
            }.bind(this), 500)

            var _t = this;

            clearTimeout(this.saveTimeout);
            clearTimeout(this._stopScrubbingTimeout);
            if(this._jumpingVideo) {
                this._showRWOverlay();
                return;
            }

            this._delta = -1;



            if (_t.shouldScrub) {
                _t.shouldScrub = false;

                _t.scrubInterval =
                    setInterval(function() {
                    _t.trigger("newstep");
                }, 250);

            } else {
                _t.stopStickyScrubbing();
            }

        },
        setSetTimeout:function(){
            clearTimeout(this.saveTimeout);
            clearTimeout(this._stopScrubbingTimeout);

            var _t = this;
            this.saveTimeout = setTimeout(function(){
                _t.trigger("stepset", _t.step);
            },1000);
        },
        isScrubbing: function(){
            return false;
        },
        _startScrubState: function(){
            $('#scrubDirection').show();
            $('#progressBar').addClass('scrubbing');

            $('#scrubDirection').show();
            $('#scrubDirection').removeClass('ff').removeClass('rw');
            if(this._delta == -1){
                this._showRWOverlay();
                $("#scrubDirection").addClass('rw');
            }
            else if(this._delta == 1){
                this._showFFOverlay();
                $('#scrubDirection').addClass('ff');
            }
        },
        _showRWOverlay: function() {
            $("#rw-overlay").css({ top: 0});
        },
        _showFFOverlay: function() {
            $("#ff-overlay").css({ top: 0});
        },
        _stopScrubState: function(){
            MediaPlayer.once('timeupdate', function() {
                $(".dir-overlay").css({top: -720})
                $('#scrubDirection').hide();
            })

            $('#progressBar').removeClass('scrubbing');
        },
        _startScrubbing: function(){
            var updateStepDivisor;

            this._scrubbing = true;
            this._startScrubState();

            if(this.isUsingJumpMode())
                updateStepDivisor = 50;
            else
                updateStepDivisor = 50;


            if(MediaPlayer.playing()){
                MediaPlayer.pause();
            }

            this._startTime = MediaPlayer.currentTime();
            this._duration  = MediaPlayer.duration();
            this.stepsize   = Math.floor(this._duration / updateStepDivisor);

        },
        _stopScrubbing: function(){
            var self;
            self = this;
            this._stopScrubbingTimeout = setTimeout(function(){

                self._scrubbing = false;    //trying to put this here.

                MediaPlayer.once('timeupdate', function(/*time*/) {
                    self.step  = 0;
                    self._scrubbing = false;
                    self._stopScrubState();
                    self.lockScrubbing = false;
                }, this);

            },3000);
        },
        _newStep: function(/*step*/){
            //used when not in jump mode
            var d, updatedProgressTime, step;
            this._startScrubState();

            if(this.lockScrubbing) //never seem to hit this
                return;

            if(!this._scrubbing){
                this._startScrubbing();
            }

            this.step += (this.stepsize * this._delta);
            step = this.step;

            updatedProgressTime = this._startTime;
            updatedProgressTime += step;

            d = this._duration;

            var stop = false;

            console.log("UPDATED PROGRESS TIME ", updatedProgressTime)
            if(updatedProgressTime > d) {
                stop = true;
                updatedProgressTime = d - 3000;
            }
            if(updatedProgressTime <= 0) {
                updatedProgressTime = 2000;
                stop = true;
            }


            // $('#videoDebug').append(d+"<br>")
            //    $('#videoDebug2').append(MediaPlayer.duration()+"<br>")
            $log('newstep called for updatedProgressTime = ', updatedProgressTime);

            //scene.updateTimeDisplay(updatedProgressTime, d);		///hook this up to the scene

            this._currentScrubTime  = updatedProgressTime;
            this.trigger('scrubTimeupdate',updatedProgressTime);
            if(stop) {
                this.stopStickyScrubbing();
            }

        },
        _stepSet: function(){
            if(this._jumpingVideo) return;
            $log('step set called for time = ' , this._currentScrubTime);
            var seconds, curTime, translated;
            curTime     = this._currentScrubTime;
            translated  = Util.convertMstoHumanReadable(curTime);
            seconds     = translated.totalSeconds;

            MediaPlayer.disableTimeUpdates();

            if(Platform.name == "panasonic")
                MediaPlayer.play();                 //pansonic bug

            showLoader();
            this._jumpingVideo = true;
            $(".dir-overlay").css({top: -720})
            MediaPlayer.jumpToTime(seconds);
            MediaPlayer.once('timeupdate', function() {
                this._jumpingVideo = false;
                hideLoader();
            }, this)

            setTimeout(function(){
                MediaPlayer.enableTimeUpdates();
            },1000);

            if(!MediaPlayer.playing()){
                MediaPlayer.play();
            }

            this._stopScrubbing();
        },
        _jump: function(){

            var seconds, curTime, translated;

            this._newStep();

            curTime     = this._currentScrubTime;
            translated  = Util.convertMstoHumanReadable(curTime);
            seconds     = translated.totalSeconds;

            MediaPlayer.jumpToTime(seconds);
            if(!MediaPlayer.playing()){
                MediaPlayer.play();
            }

            this._stopScrubbing();


        },
        activate: function(){
            var self;

            self                = this;
            this._scrubbing     = false;
            this.shouldScrub    = true;
            this.scrubInterval  = null;
            this.lockScrubbing  = false;    //not really used
            this.count          = 0;        //not really used
            this.step           = 0;

            this._setJumpMode();

            $log('activete called ');

            //TODO: why is this being called twice?
            this.off('newstep',null,this);
            this.on('newstep',function(){
                self._newStep();
            }, this);

            this.off("stepset",null,this);
            this.on("stepset",function(){
                self._stepSet();
            }, this);
        },
        deactivate: function(){
            clearInterval(this.scrubInterval);
            this.off(null, null, this);
        },
        exit: function() {
            clearTimeout(this.saveTimeout);
            clearTimeout(this._stopScrubbingTimeout);
            this.deactivate();
            $(".dir-overlay").css({top: -720})
        }
    });

	return scrubManager;
});