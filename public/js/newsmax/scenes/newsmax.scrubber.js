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



	var scrubManager = {};

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
        stopStickyScrubbing: function(pausebutton) {
            this._stopScrubState();
            var _t = this;
            var _pausebutton = pausebutton || false
            if (_pausebutton !== false) {
                var self = this;
                var seconds, curTime, translated;
                curTime = this._currentScrubTime;
                translated = Util.convertMstoHumanReadable(curTime);
                seconds = translated.totalSeconds;
                _t.shouldScrub = true;
                clearTimeout(_t.scrubInterval);
                MediaPlayer.jumpToTime(seconds);
                MediaPlayer.pause();
                self.step = 0;
                self._scrubbing = false;
                self._stopScrubState();
                self.lockScrubbing = false;

                return
            }

            if (!_t._scrubbing) return;
           
            _t.shouldScrub = true;
            _t.lockScrubbing = true;

            clearTimeout(_t.scrubInterval);
            _t.trigger('stepset');
        },
        onRight:function(){
            var _t = this;

            clearTimeout(this.saveTimeout);
            clearTimeout(this._stopScrubbingTimeout);

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
            var _t = this;

            clearTimeout(this.saveTimeout);
            clearTimeout(this._stopScrubbingTimeout);

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
            //return this._scrubbing;
        },
        _startScrubState: function(){
            $('#scrubDirection').show();
            $('#progressBar').addClass('scrubbing');

            $('#scrubDirection').removeClass('ff').removeClass('rw');
            if(this._delta == -1){
                $("#scrubDirection").addClass('rw');
            }
            else if(this._delta == 1){
                $('#scrubDirection').addClass('ff');                
            }
        },
        _stopScrubState: function(){
            $('#scrubDirection').hide();
            $('#progressBar').removeClass('scrubbing');
        },
        _startScrubbing: function(){
            var updateStepDivisor;
            
            this._scrubbing = true;
            this._startScrubState();

            if(this.isUsingJumpMode())
                updateStepDivisor = 50;
            else
                updateStepDivisor = 100;


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
            
            if(updatedProgressTime > d)
                updatedProgressTime = d;
            if(updatedProgressTime < 0)
                updatedProgressTime = 0;

            // $('#videoDebug').append(d+"<br>")
            //    $('#videoDebug2').append(MediaPlayer.duration()+"<br>")

         	this.trigger('scrubTimeupdate',updatedProgressTime);
            //scene.updateTimeDisplay(updatedProgressTime, d);		///hook this up to the scene

            this._currentScrubTime  = updatedProgressTime;

            if(updatedProgressTime === 0)            // for the beginning
                this.stopStickyScrubbing();
            if(updatedProgressTime == d)          // for the end
                this.stopStickyScrubbing();  
        },
        _stepSet: function(){
            
            var seconds, curTime, translated;
            curTime     = this._currentScrubTime;
            translated  = Util.convertMstoHumanReadable(curTime);
            seconds     = translated.totalSeconds;
            MediaPlayer.jumpToTime(seconds);
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
            
            this.on('newstep',function(){
                self._newStep();
            }, this);

            this.on("stepset",function(){
                self._stepSet();
            }, this);
        },
        deactivate: function(){
            clearTimeout(this.scrubInterval);
            this.off(null, null, this);
        }
    });

	return scrubManager;
});