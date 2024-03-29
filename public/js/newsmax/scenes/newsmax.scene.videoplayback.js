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
	var PlatformInfo = extractPlatformInfo(Platform);

    videoPlayback = new StageManager.Scene({
        defaultScene: false,
        name: "videoPlayback",
        target: "#videowrapper",
        view: "views/newsmax.videoplayback.html"
    });

    var controlsUp      = videoPlayback.createState('controlsup', true);
    var controlsDown    = videoPlayback.createState('controlsdown', false);
    var backMenu, hideMenu, progressBarTrueWidth;
    var dummy           = new Navigation.Menu();
    var closeMenu       = new Navigation.Menu();    //todo: delete this one
    var disableBack     = false;
    var timeout;
    var $disableHiding  = false;
    var video, trackInterval, lastState;
    var videoInitialized;

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
        progressBarTrueWidth = $("#progressBarBack").outerWidth();
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

        var context ={}
        MediaPlayer.on('timeupdate',function(time){
            if(time > 0){
                videoInitialized = true;
                hideLoader();
                TrickMenu.enable();
                initKeyhandlers();
                touchTimeout();
                MediaPlayer.off(null,null,context);
            }
        },context);

		MediaPlayer.on('play', function() {
			console.log('Video Playback has started ');
			var video = MediaPlayer.getCurrentItem();
			var title = video.attributes.title;

			udm_('http' + (document.location.href.charAt(4) == 's' ? 's://sb' : '://b') + '.scorecardresearch.com/b?c1=2&c2=9248945&ns_site=newsmax&name='+title+'&category=live&nmx_site=nmx&nmx_pfm=tv&nmx_sub_category=video&nmx_page_type=vod&event=Media_Play&event_timestamp='+getCurrentTimeString()+'&version='+PlatformInfo.pversion+'&device_type='+PlatformInfo.platform+'&device_id='+PlatformInfo.deviceid+'&os='+PlatformInfo.pos);
			CurrentMedia = video;
			$('body').css('background', 'transparent');

		},context);


        TrickMenu.setFocusTo("onStop");
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

        videoInitialized = false;
    }

    videoPlayback.onleavescene = function() {
	  var video = MediaPlayer.getCurrentItem();
	  var title = video.attributes.title;
      MediaPlayer.off("videoup",null,videoPlayback);
      $("body").css('background','transparent');
      clearTimeout(timeout);
      $("#videowrapper").hide();
      $("#progressBar").css({ width: 0 });
      $("#timecode").empty();
      $('#duration').empty();
      $('#scrubDirection').hide();
      $(".trickPlayButton").removeClass("selected focused");
      $('#hideTrayButton').removeClass('focused');  //not sure why i am having to add this here?
      teardownKeyhandlers();
      scrubManager.exit();
      MediaPlayer.stop();
      hideMenu.off(null, null, this);
      TrickMenu.off(null, null, this);
      closeMenu.off(null,null,this);
      MediaPlayer.off(null,null,this);
	  udm_('http' + (document.location.href.charAt(4) == 's' ? 's://sb' : '://b') + '.scorecardresearch.com/b?c1=2&c2=9248945&ns_site=newsmax&name='+title+'&category=live&nmx_site=nmx&nmx_pfm=tv&nmx_sub_category=video&nmx_page_type=vod&event=Media_Exit&event_timestamp='+getCurrentTimeString()+'&version='+PlatformInfo.pversion+'&device_type='+PlatformInfo.platform+'&device_id='+PlatformInfo.deviceid+'&os='+PlatformInfo.pos);
	  CurrentMedia = null;
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
        progress_width = Math.ceil(progress * progressBarTrueWidth);
        $("#timecode").text(current + " / " + total);
        $("#progressBar").css({ width: progress_width });
        $('#scrubDirection').css({ left: (progress_width - 33) });
    }

    function initVideoPlayback() {
        var playlist =  video.getPlaylist();
        playlist.playlistItems[0].attributes.title = video.attributes.title;
        MediaPlayer.setPlaylist(playlist);
        MediaPlayer.play();
        $(".trickPlayButton.play").addClass("selected");
    }

    function initKeyhandlers() {

        KeyHandler.off(null, null, videoPlayback);  //always do this so that we don't do multiple bindings. realize this = the videoplayer scene

        KeyHandler.on("onPlay", function() {
            if(videoPlayback.currentState!=='controlsup') videoPlayback.changeState('controlsup');
            TrickMenu.setFocusTo('onPlay');
            $(".trickPlayButton").removeClass("selected");
            $(".trickPlayButton.play").addClass("selected");

            if (scrubManager._scrubbing) {
                scrubManager.stopStickyScrubbing();
                return;
            }

            if(MediaPlayer.playing()) return;

            MediaPlayer.play();
			var video = MediaPlayer.getCurrentItem();
			var title = video.attributes.title;
			udm_('http' + (document.location.href.charAt(4) == 's' ? 's://sb' : '://b') + '.scorecardresearch.com/b?c1=2&c2=9248945&ns_site=newsmax&name='+title+'&category=live&nmx_site=nmx&nmx_pfm=tv&nmx_sub_category=video&nmx_page_type=vod&event=Media_Play&event_timestamp='+getCurrentTimeString()+'&version='+PlatformInfo.pversion+'&device_type='+PlatformInfo.platform+'&device_id='+PlatformInfo.deviceid+'&os='+PlatformInfo.pos);
			CurrentMedia = video;
        }, videoPlayback);

        KeyHandler.on("onPause", function() {
            if(videoPlayback.currentState!=='controlsup') videoPlayback.changeState('controlsup');
            TrickMenu.setFocusTo('onPause');
            $(".trickPlayButton").removeClass("selected");
            $(".trickPlayButton.pause").addClass("selected");

            if (scrubManager._scrubbing) {
                scrubManager.stopStickyScrubbing("pausebutton");
                MediaPlayer.pause();
                return;
            }

            MediaPlayer.pause();
			var video = MediaPlayer.getCurrentItem();
			var title = video.attributes.title;
			udm_('http' + (document.location.href.charAt(4) == 's' ? 's://sb' : '://b') + '.scorecardresearch.com/b?c1=2&c2=9248945&ns_site=newsmax&name='+title+'&category=live&nmx_site=nmx&nmx_pfm=tv&nmx_sub_category=video&nmx_page_type=vod&event=Media_Pause&event_timestamp='+getCurrentTimeString()+'&version='+PlatformInfo.pversion+'&device_type='+PlatformInfo.platform+'&device_id='+PlatformInfo.deviceid+'&os='+PlatformInfo.pos);
        }, videoPlayback);

        KeyHandler.on("onStop", function() {
            if(videoPlayback.currentState!=='controlsup') videoPlayback.changeState('controlsup');
            TrickMenu.setFocusTo('onStop');
            $(".trickPlayButton").removeClass("selected");
            $(".trickPlayButton.stop").addClass("selected");

            if (scrubManager._scrubbing) {
                scrubManager.stopStickyScrubbing();
            }
            MediaPlayer.stop();
			var video = MediaPlayer.getCurrentItem();
			var title = video.attributes.title;
			udm_('http' + (document.location.href.charAt(4) == 's' ? 's://sb' : '://b') + '.scorecardresearch.com/b?c1=2&c2=9248945&ns_site=newsmax&name='+title+'&category=live&nmx_site=nmx&nmx_pfm=tv&nmx_sub_category=video&nmx_page_type=vod&event=Media_Stop&event_timestamp='+getCurrentTimeString()+'&version='+PlatformInfo.pversion+'&device_type='+PlatformInfo.platform+'&device_id='+PlatformInfo.deviceid+'&os='+PlatformInfo.pos);
        }, videoPlayback);

        KeyHandler.on("onRW", function() {
            if(videoPlayback.currentState!=='controlsup') videoPlayback.changeState('controlsup');
            TrickMenu.setFocusTo('onRW');
            $(".trickPlayButton").removeClass("selected");
            $(".trickPlayButton.rewind").addClass("selected");

            if (scrubManager._scrubbing) {
               // scrubManager.stopStickyScrubbing();
                return;
            }


            scrubManager.onLeft();
        }, videoPlayback);

        KeyHandler.on("onFF", function() {
            if(videoPlayback.currentState!=='controlsup') videoPlayback.changeState('controlsup');
            TrickMenu.setFocusTo('onFF');
            $(".trickPlayButton").removeClass("selected");
            $(".trickPlayButton.fastforward").addClass("selected");
            //debugger;
            if (scrubManager._scrubbing) {
                // scrubManager.stopStickyScrubbing();
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
                //hideLoader();
				//console.log('event: ' + event + ' - params: ', params);
                break;
            case 'playlist:newplaylistitem':
                break;
            case 'bufferingend':
                if(videoInitialized) hideLoader(); // This is to address an LG bug where buffering ends well before play starts
                break;
            case 'bufferingstart':
                showLoader();
                break;
            case 'playlist:ended':
                StageManager.StageHistory.back();
                break;
            case 'onstop':
                StageManager.StageHistory.back();
		console.log('event: ' + event + ' - params: ', params);
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
