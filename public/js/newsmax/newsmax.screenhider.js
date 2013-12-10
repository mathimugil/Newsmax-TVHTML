define(['backbone', 'keyhandler', 'jquery', 'stagemanager','navigation'], function(Backbone, KeyHandler, $, StageManager, Navigation) {

    
    window.ScreenHider = function() {
        this.timeout = null;
        this._timeoutLength = 70000;
        _.extend(this, Backbone.Events);
    };

    ScreenHider.prototype.start = function(timeoutLength) {
        $log('screenhider has started');
        //if (!$masterHide) return;
        clearTimeout(this.timeout);
        this._timeoutLength = _.isNumber(timeoutLength) ? timeoutLength : 5000;
        if (this._timeoutLength < 500) $error(" Screen Hide timeout is less then 500ms, is this right?");
        KeyHandler.off(null, null, this);
        this.touchHideTimeout();
        
        KeyHandler.on('onUp onDown onLeft onRight onSelect onReturn', function() {
            $log('keyhandler detected a movement');
            this.touchHideTimeout();
        }, this);
    };

    ScreenHider.prototype.touchHideTimeout = function() {
        clearTimeout(this.timeout);
        var _t = this;
        this.timeout = setTimeout(function() {
            _t.trigger("hidescreen");
        }, this._timeoutLength)
    };

    ScreenHider.prototype.end = function() {
        this.off(null, null, null);
        clearTimeout(this.timeout);
    };

    window.$startScreenHider = function() {
        var screenHider, lastMenu, showScreen;

        screenHider = new ScreenHider();

        var menu = new Navigation.Menu();   //dummy

        screenHider.on('showscreen',function(){
          menu.trigger('something');                //should wake up interface, if hidden
        });

        screenHider.on('hidescreen', function() {
            var self = this;
            
            if(StageManager.scene.name!='main'){
                screenHider.touchHideTimeout();
                return;
            }

            if ($disableScreenHider) return;
            
            StageManager.getScene('main').disableBack = true;   //could be in the homeScene, lets disable the backbutton there

            lastMenu = Navigation.currentFocus.menu;

            $('#wrapper').fadeOut();
            
            menu.focus();
            menu.on('all', function() {
                showScreen();
            });

            /*focusInterval = setInterval(function(){
                if(TVEngine.Navigation.currentMenu.name != 'ade:dummymenu') 
                    TVEngine.Navigation.getMenu("ade:dummymenu").focus();
            },500);*/


            showScreen = function() {
                //clearInterval(focusInterval);
                $log('showScreen');
                $('#wrapper').fadeIn();
                menu.off();
                lastMenu.focus();
                window.onmouseon = null;
                screenHider.touchHideTimeout();
                StageManager.getScene('main').disableBack = false;
            }
            
            //TODO: test this on the LG
            var mouseon_handler = function() {
                showScreen();
            };
            window.onmouseon = mouseon_handler;

        }, this);

        screenHider.start($globalTimeout);

        return screenHider;
    }

    return ScreenHider;

});