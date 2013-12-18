define([
    'stagemanager', 
    'navigation', 
    'platform', 
    'jquery', 
    'underscore', 
    'backbone', 
    'mediaplayer', 
    'keyhandler', 
    'utils', 
    'newsmax/scenes/newsmax.scrubber', 
    'newsmax/menus/newsmax.menus.trickplay', 
    'newsmax/menus/newsmax.menus.backmenu',
    'config',
    'newsmax/menus/newsmax.menu.clickablemenu',
    'newsmax/newsmax.magicremote'
    ],
    function(
        StageManager,
        Navigation,
        Platform,
        $,
        _,
        Backbone,
        MediaPlayer,
        KeyHandler,
        Util,
        scrubManager,
        TrickMenu, 
        BackMenu,
        conf,
        ClickableMenu,
        magicRemote
        ) {

    var videoPlayback,
        videoProgressInMS;
   
    videoPlayback = new StageManager.Scene({
        defaultScene: false,
        name: "videoPlayback",
        target: "#videowrapper",
        view: "views/newsmax.videoplayback.html"
    });

    var controlsUp      = videoPlayback.createState('controlsup', true);
    var controlsDown    = videoPlayback.createState('controlsdown', false);
    var backMenu, hideMenu;
    var dummy           = new Navigation.Menu();
    var closeMenu       = new Navigation.Menu();    //todo: delete this one
    var disableBack     = false;
    var timeout;
    var $disableHiding  = false;
    var video, trackInterval, lastState;

    videoPlayback.handlesback = function(){
        if(disableBack == true) return false;
        else return true;
    }

    videoPlayback.onenterscene = function() {
        
        if(!backMenu){
            backMenu = new BackMenu({
                el: ".backButton"
            });
        }

        if(!hideMenu){
            hideMenu = new ClickableMenu({
                el:'#hideTrayButton'
            });
        }

        videoPlayback.hasScrubbed = false;

        $("#videowrapper").show();
        TrickMenu.disable();
        showLoader();
        
        if (!this.persist.params) $error('!video scene needs paramater!');

        video = this.persist.params.item

        $('#vtitle').html(video.attributes.title);
        $('#vdescription').html(video.attributes.description);
        $('#vdescription').ellipsis({ row: 2 });
        initVideoPlayback();
        initKeyhandlers();
        bindMediaEventHandler();

        TrickMenu.setElement("#trickPlayContainer");
 
        MediaPlayer.once('timeupdate',function(){
            TrickMenu.enable();
            initKeyhandlers();
            $("#loadingVideoIndicator").fadeOut();
            touchTimeout();
        },this);

        TrickMenu.focus();
        
        hideMenu.on('onfocus', function() {
            $('#hideTrayButton').addClass('focused');
        }, this);
        
        hideMenu.on('onblur', function() {
            $('#hideTrayButton').removeClass('focused');
        }, this);
        hideMenu.on('onselect', function() {
            videoPlayback.changeState('controlsdown');
        }, this);

        hideMenu.on('ondown', function() {
            TrickMenu.focus();
        }, this)

        hideMenu.on('onup',function(){
            if($('.backButton:visible').length!==0){  backMenu.focus();}    
        },this);
    }

    videoPlayback.onleavescene = function() {
      MediaPlayer.off("videoup",null,videoPlayback);
      $("body").css('background','transparent');
      clearTimeout(timeout);
      $("#videowrapper").hide();
      $("#progressBar").css({ width: 0 });
      $("#timecode").empty();
      $('#hideTrayButton').removeClass('focused');  //not sure why i am having to add this here?
      teardownKeyhandlers();
      scrubManager.deactivate();
      MediaPlayer.stop();
      hideMenu.off(null, null, this);
      TrickMenu.off(null, null, this); 
      closeMenu.off(null,null,this); 
      MediaPlayer.off(null,null,this);
    }

    controlsUp.onenterstate = function() {
        $("#videowrapper").fadeIn();

        TrickMenu.on('onup', function() {
            hideMenu.focus();
        }, this);

        backMenu.on('ondown',function(){
            hideMenu.focus();
        },this)

        if( MediaPlayer.playing() ) {
             touchTimeout();
        } else {
            MediaPlayer.once('timeupdate',function(){
                touchTimeout();
            },this); 
        }
        KeyHandler.on('onRight onLeft onUp onDown onSelect', function() {
            touchTimeout();
        }, this);

        if(Platform.name == 'lg'){
            
            this.oldMouseoff = window.onmouseoff;
            window.onmouseoff = function(){
                touchTimeout();
                //this.oldMouseoff();   //TODO: fire the old mouseoff event
            }

        }

    }
    controlsUp.onleavestate = function() {
        window.onmouseoff = this.oldMouseoff;
        this.interval = null;
        backMenu.off(null,null, this);
        hideMenu.off(null, null, this);
        TrickMenu.off(null, null, this);
        KeyHandler.off(null, null, this);
        lastState = "controlsup";
    }

    controlsDown.onenterstate = function() {
        disableBack = true;
        $('#videowrapper').fadeOut();

        dummy.on('onright onleft onup ondown onselect',function(e,l){
            if(!lastState) videoPlayback.changeState('controlsup');
            else videoPlayback.changeState(lastState);
            Navigation.back();
        }, this);

        dummy.focus();

        KeyHandler.on('onReturn',function(){ dummy.trigger('onselect'); },this);

        if(Platform.name === 'lg')
            (window.NetCastGetMouseOnOff() == 'on') ? magicRemote.detectMouseOff(dummy) : magicRemote.detectMouseOn(dummy);
    }

    controlsDown.onleavestate = function() {
        dummy.off(null,null,this);
        KeyHandler.off(null,null,this);
        $('#videowrapper').show();
        disableBack = false;
    }

    var touchTimeout = function(){
        clearTimeout(timeout);
        timeout = setTimeout(function(){
            if(conf.disableScreenHider) return;

            if(Platform.name == 'lg' && (window.NetCastGetMouseOnOff() == 'on')){
                    touchTimeout();
                    return;
            }

            if(MediaPlayer.playing()){
                videoPlayback.changeState('controlsdown');
            }   
            else
                touchTimeout();
        }, conf.globalTimeout);
    }

    function timeUpdateHandler(currentTime) {
        var duration;
        duration = MediaPlayer.duration();
        if (_.isNumber(duration)) {
            videoProgressInMS = currentTime;
            /*if(currentTime==0){
                $("#errorField").append($("<div>mediaplayer firing 0</div>"))
            }*/
            videoPlayback.updateTimeDisplay(currentTime, duration);
        } else {
            return;
        }
    }

    
    videoPlayback.updateTimeDisplay = function(currentTime, duration) {
        if(currentTime==0 && videoPlayback.hasScrubbed)
            return;
        var current, total, progress, progress_width;
        total = Util.convertMstoHumanReadable(duration);
        if (currentTime > duration) {
            current = total;
            progress = 1;
        } else {
            current = Util.convertMstoHumanReadable(currentTime);
            progress = (currentTime / duration);
        }
        progress_width = Math.ceil(progress * 1129);
        $("#timecode").text(current);
        $("#progressBar").css({ width: progress_width });
        $('#scrubDirection').css({ left: (progress_width - 33) });
    }

    function initVideoPlayback() {
        var playlist =  video.getPlaylist();
        MediaPlayer.setPlaylist(playlist);
        MediaPlayer.play();
    }

    function initKeyhandlers() {
        
        KeyHandler.off(null, null, videoPlayback);  //always do this so that we don't do multiple bindings. realize this = the videoplayer scene

        KeyHandler.on("onPlay", function() {
            if(videoPlayback.currentState!=='controlsup') videoPlayback.changeState('controlsup');
            TrickMenu.setFocusTo('onPlay');

            if (scrubManager._scrubbing) {
                scrubManager.stopStickyScrubbing();
                return;
            }

            if(MediaPlayer.playing()) return;

            MediaPlayer.play();
        }, videoPlayback);

        KeyHandler.on("onPause", function() {
            if(videoPlayback.currentState!=='controlsup') videoPlayback.changeState('controlsup');
            TrickMenu.setFocusTo('onPause');

            if (scrubManager._scrubbing) {
                scrubManager.stopStickyScrubbing("pausebutton");
                MediaPlayer.pause();
                return;
            }

            MediaPlayer.pause();
        }, videoPlayback);

        KeyHandler.on("onStop", function() {
            if(videoPlayback.currentState!=='controlsup') videoPlayback.changeState('controlsup');
            TrickMenu.setFocusTo('onStop');

            if (scrubManager._scrubbing) {
                scrubManager.stopStickyScrubbing();
            }

            MediaPlayer.stop();
        }, videoPlayback);

        KeyHandler.on("onRW", function() {
            if(videoPlayback.currentState!=='controlsup') videoPlayback.changeState('controlsup');
            TrickMenu.setFocusTo('onRW');

            if (scrubManager._scrubbing) {
                scrubManager.stopStickyScrubbing();
                return;
            }

            //if(!MediaPlayer.playing()) return;  <-- doesn't allow rew from paused state

            scrubManager.onLeft();
        }, videoPlayback);

        KeyHandler.on("onFF", function() {
            if(videoPlayback.currentState!=='controlsup') videoPlayback.changeState('controlsup');
            TrickMenu.setFocusTo('onFF');
            //debugger;
            if (scrubManager._scrubbing) {
                scrubManager.stopStickyScrubbing();
                return;
            }

            //if(!MediaPlayer.playing()) return; // <-- doesn't allow ff from paused state

            scrubManager.onRight();
        }, videoPlayback);

        scrubManager.activate();
    }

    function bindMediaEventHandler() {

        MediaPlayer.on('all', mediaEventHandler, videoPlayback);

        scrubManager.on('scrubTimeupdate', function(updatetime) {
            //$log("scrubTimeupdate updating time: ", updatetime);
            videoPlayback.hasScrubbed = true;
            /*if(updatetime==0){
                $("#errorField").append($("<div>scrubber firing 0</div>"))                
            }*/

            videoPlayback.updateTimeDisplay(updatetime, MediaPlayer.duration());
        }, videoPlayback);
       
    }

    function mediaEventHandler(event, param) {
        var scrubber, scrubbing, scene;

        scene       = videoPlayback;
        scrubber    = scrubManager;
        scrubbing   = scrubber.isScrubbing();
        switch (event) {
            case 'timeupdate':
                if (!scrubbing)
                    timeUpdateHandler(param);
                break;
            case 'play':
                break;
            case 'playlist:newplaylistitem':
                break;
            case 'bufferingend':
                hideLoader();
                break;
            case 'bufferingstart':
                showLoader();
                break;
            case 'playlist:ended':
                StageManager.StageHistory.back();  
                break;
            case 'onstop':
                StageManager.StageHistory.back();
                break;
            case 'videoerror':
                //$log('There was an error in videoplayback scene - make sure you are using safari for hls streams');
                StageManager.StageHistory.back();
                //TODO: set error flag to check while exiting the scene
        }
    }

    function teardownKeyhandlers() {
        MediaPlayer.off(null, null, videoPlayback);
        KeyHandler.off(null, null, videoPlayback);
    }
    
    var showLoader = function(){
      $("#circularG").fadeIn();
    }
    
    var hideLoader = function(){
      $("#circularG").fadeOut();
    }

    return videoPlayback;
});