define(['backbone', 'keyhandler', 'jquery', 'stagemanager', 'navigation', 'config', 'platform'], function(Backbone, KeyHandler, $, StageManager, Navigation, conf, Platform) {


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

        if(Platform.name == 'lg'){

            setInterval(function(){             //TODO: could be improved with a dip and switch.
                var status = window.NetCastGetMouseOnOff();
                //$("#errorField").append($('<div>status = ' + status + '</div>'))
                if(status=='on'){
                    screenHider.touchHideTimeout();
                }
            },4000);

        }

        screenHider.on('hidescreen', function() {
            var self = this;

            if(StageManager.scene.name!='main'){
                screenHider.touchHideTimeout();
                return;
            }

            if($("#wrapper").is(':hidden')){
                screenHider.touchHideTimeout();
                return;
            }

            if(conf.pauseScreenhider){
                screenHider.touchHideTimeout();
                $log(">>>>>>> ignoring this hide trigger, api is working");
                return;
            }

            if(window.NetCastGetMouseOnOff && window.NetCastGetMouseOnOff() == 'on'){
                screenHider.touchHideTimeout();
                $log('ignoring this hide screen because LG mouse is on');
                return;
            }

            if (conf.disableScreenHider) return;



            StageManager.getScene('main').disableBack = true;   //could be in the homeScene, lets disable the backbutton there

            lastMenu = Navigation.currentFocus.menu;

            $('#wrapper').fadeOut();

            menu.focus();
            menu.on('all', function() {
                window.onmouseon = oldMouseon;
                showScreen();
            });

            // focusInterval = setInterval(function(){
            //     if(Navigation.currentMenu.name != 'ade:dummymenu')
            //         Navigation.getMenu("ade:dummymenu").focus();
            // }, 500);


            showScreen = function() {
                $('#wrapper').fadeIn();
                menu.off();
                lastMenu.focus();
                window.onmouseon = oldMouseon;
                screenHider.touchHideTimeout();
                StageManager.getScene('main').disableBack = false;
            }

            //TODO: test this on the LG
            var oldMouseon = window.onmouseon;
            window.onmouseon = function() {
                showScreen();
                oldMouseon();
            };

        }, this);

        screenHider.start(conf.globalTimeout);

        return screenHider;
    }

    return ScreenHider;

});