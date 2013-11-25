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
    'jquery.loadingdotdotdot'
    ],
    function(
        StageManager, 
        Navigation, 
        Platform, 
        $, 
        //sampleTemplate, 
        _, 
        Backbone, 
        //API, 
        MediaPlayer, 
        KeyHandler, 
        Util, 
        scrubManager, 
        TrickMenu, 
        //appconfig, 
        //Models, 
        BackMenu, 
        //Send,
        jqLoadingdotdotdot
        ) {

    var videoPlayback,
        videoProgressInMS, hideMenu = new Navigation.Menu();

    /*if($storage.getItem('firstRun'))var tmpDefault=false;
    else var tmpDefault=true;*/
   
    videoPlayback = new StageManager.Scene({
        defaultScene: false,
        name: "videoPlayback",
        target: "#wrapper",
        view: "views/newsmax.videoplayback.html"
    });

    var controlsUp      = videoPlayback.createState('controlsup', true);
    var controlsDown    = videoPlayback.createState('controlsdown', false);
    //var aboutState      = videoPlayback.createState('about',false);
    //var expiredState    = videoPlayback.createState('expired',false);

    var backMenu        = new BackMenu();
    var dummy           = new Navigation.Menu();
    var closeMenu       = new Navigation.Menu();
    var disableBack     = false;
    var timeout;
    var $disableHiding  = false;
    var video, continueB, joinB;
    var trackInterval;
    var lastState;
       
    /*var showBackButtonAndText;
    showBackButtonAndText=function(){
        $('.backButton').show();
        $('.now-playing-text').show();
    }*/

    videoPlayback.handlesback = function(){
        if(disableBack == true) return false;
        else return true;
    }

    videoPlayback.onenterscene = function() {

        TrickMenu.disable();
        showLoader();
        
        if (!this.persist.params) $error('!video scene needs paramater!');

        video = this.persist.params.item //|| Send.currentVideo();
        
        $('.now-playing-text').html("sample text");
        initVideoPlayback();

        //initKeyhandlers();
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
            //if(scene.isPlayingWhatIsYogaGlo) return;
            if($('.backButton:visible').length!==0){  backMenu.focus();}    
        },this);

        
        //if(!appconfig.userId) return;   

        /*return API.fetchUserFavoritesIDs().done(function(favorites) {
            video.set('favorite', _.include(favorites, video.get('idvideo')));
            updateFavoriteDisplay(true);
        })*/
    }

    videoPlayback.onleavescene = function() {
      teardownKeyhandlers();
      scrubManager.deactivate();
      MediaPlayer.stop();
      hideMenu.off(null, null, this);
      TrickMenu.off(null, null, this);  
      MediaPlayer.off(null,null,this);
    }

    controlsUp.onenterstate = function() {
        
        $log(" CONTORLSUP onenterstate");
        
        TrickMenu.on('onup', function() {
            hideMenu.focus();
        }, this);

        backMenu.on('ondown',function(){
            hideMenu.focus();
        },this)
        
        /*TrickMenu.on('selectedindex',function(idx){
            if(idx == 5) {
                if(!videoPlayback.isPlayingWhatIsYogaGlo){
                  videoPlayback.changeState('about');
                  closeMenu.focus();  
                } 
                else {
                    $log('skip this video');
                    StageManager.changeScene('main',{blowStack:true});
                }   
            }
            else if (idx == 6) toggleFavorite();
        }, this);*/

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

    }
    controlsUp.onleavestate = function() {
        backMenu.off(null,null, this);
        hideMenu.off(null, null, this);
        TrickMenu.off(null, null, this);
        KeyHandler.off(null, null, this);
        lastState = "controlsup";
    }

    controlsDown.onenterstate = function() {
        disableBack = true;
        $('#wrapper').hide();
        $log('E N T E R I N G controlsDown state');

        dummy.on('onright onleft onup ondown onselect',function(e,l){
            if(!lastState) videoPlayback.changeState('controlsup');
            else videoPlayback.changeState(lastState);
            Navigation.back();
        }, this);

        dummy.focus();

        KeyHandler.on('onReturn',function(){ dummy.trigger('onselect'); },this);      
    }

    controlsDown.onleavestate = function() {
        dummy.off(null,null,this);
        KeyHandler.off(null,null,this);
        $('#wrapper').show();
        disableBack = false;
    }


    function updateVideoInfo(video){
        //TODO: implement if we need something like that on this screen
        return;
        /*$('.aboutModal #videoInfo h2').html(video.get('title'));
        $('.aboutModal #videoInfo .data .style').html('<span>Style:</span>' + video.get('style'));
        $('.aboutModal #videoInfo .description').text(video.get('description'));
        $('.aboutModal #videoInfo .data .teacher').html(video.get('teacher'));
        $('.aboutModal #videoInfo .data .level').html(convertLevel('Level '+video.get('level')));
        $('.aboutModal #videoInfo .data .duration').html(video.get('durationMin')+'min');*/
    }
    
    var touchTimeout = function(){
        clearTimeout(timeout);
        timeout = setTimeout(function(){
            if(MediaPlayer.playing()){
                if($disableHiding) return;
                videoPlayback.changeState('controlsdown');
            }   
            else
                touchTimeout();
        }, 15000);
    }

    function timeUpdateHandler(currentTime) {

        var duration;

        duration = MediaPlayer.duration();

        if (_.isNumber(duration)) {
            videoProgressInMS = currentTime;
            videoPlayback.updateTimeDisplay(currentTime, duration);
        } else {
            return;
        }

    }

    videoPlayback.updateTimeDisplay = function(currentTime, duration) {

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
      // debugger;
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

            if(!MediaPlayer.playing()) return;

            scrubManager.onLeft();
        }, videoPlayback);

        KeyHandler.on("onFF", function() {
            if(videoPlayback.currentState!=='controlsup') videoPlayback.changeState('controlsup');
            TrickMenu.setFocusTo('onFF');

            if (scrubManager._scrubbing) {
                scrubManager.stopStickyScrubbing();
                return;
            }

            if(!MediaPlayer.playing()) return;

            scrubManager.onRight();
        }, videoPlayback);

        scrubManager.activate();
    }

    function bindMediaEventHandler() {

        MediaPlayer.on('all', mediaEventHandler, videoPlayback);

        scrubManager.on('scrubTimeupdate', function(updatetime) {
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
                $log('There was an error in videoplayback scene - make sure you are using safari for hls streams');
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