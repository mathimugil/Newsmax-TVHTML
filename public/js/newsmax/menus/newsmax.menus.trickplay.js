define(['navigation', 'enginelite/menuprototypes/enginelite.menus.listmenu', 'hbs!newsmax/templates/trickplay', 'jquery', 'underscore', 'backbone', 'handlebars', 'keyhandler'], function(Navigation, ListMenu, trickPlayTemplate, $, _, Backbone, Handlebars, KeyHandler) {

	var menu = ListMenu.extend({
        events : {
          'mouseover .trickPlayButton' : 'focusOnElement',
          'click .trickPlayButton' : 'clickOnElement',
        },
        focusOnElement:function(event){
            if(this.disabled()) return;
            var idx = $(event.currentTarget).index()
            this._currentIndex = idx;

            if(!this.focused)
                this.focus();
            else
                this.setFocus();

        },
        clickOnElement:function(event){
            if(this.disabled()) return;
            var idx = $(event.currentTarget).index();
            this.trigger('selectedindex',idx);
        },
    });

    var VideoMenu = new menu({});

    VideoMenu.on('selectedindex',function(index){
      if(this.disabled()) return;
      console.log("SELECTED INDEX")
      this.$el.children().removeClass('selected');
      this.$el.children().eq(index).addClass('selected');
        switch(index.toString()){
            case "0":
                //stop
                KeyHandler.trigger('onStop');
                break;
            case "1":
                //play
                KeyHandler.trigger('onPlay');
                break;
            case "2":
                //pause
                KeyHandler.trigger('onPause');
                break;
            case "3":
                KeyHandler.trigger('onRW');
                //rewind
                break;
            case "4":
                KeyHandler.trigger('onFF');
                //fastforward
                break;

            default:
                //do nothing
        }
    }.bind(VideoMenu), this);

    VideoMenu.setFocusTo = function(type) {

        switch(type.toString()){

            case "onStop":
                this._currentIndex = 0;
                break;
            case "onPlay":
                this._currentIndex = 1;
                break;
            case "onPause":
                this._currentIndex = 2;
                break;
            case "onRW":
                this._currentIndex = 3;
                break;
            case "onFF":
                this._currentIndex = 4;
                break;
            default:
                //do nothing
        }

        //it is hidden so this will not work.
        if(this.focused) this.setFocus();
        else this.focus();
    }

    VideoMenu.on('onblur',function(){
        $('#trickPlayContainer div').removeClass('focused');
    });

    //TODO: ASK MIKE HOW TO DO THIS BETTER with extend
    VideoMenu.enabled = true;
    VideoMenu.disable = function(){
        $("#trickPlayContainer").css({
            opacity: 0.3
        })
        this.enabled = false;
    }

    VideoMenu.enable = function(){
        $("#trickPlayContainer").css({
            opacity: 1
        })
        this.enabled = true
    }

    VideoMenu.disabled = function(){
        return (this.enabled) ? false : true;
    }

	return VideoMenu;
});