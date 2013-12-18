define(['backbone', 'keyhandler', 'jquery', 'stagemanager', 'navigation', 'config', 'platform'], function(Backbone, KeyHandler, $, StageManager, Navigation, conf, Platform) {

    //how to use it?
    //(window.NetCastGetMouseOnOff() == 'on') ? obj.detectMouseOff(dummyMenu) : obj.detectMouseOn(dummyMenu);

    //Becareful if you have a global hidetimeout less then 4000 it will cycle between the two.
    //Example use: controlsDown.onenterstate()...
    var magicRemote ={
        interval:null
    }

    magicRemote.detectMouseOff = function(dummyMenu){
        setTimeout(function(){
            var status = window.NetCastGetMouseOnOff();
            if(status=='off')
                magicRemote.detectMouseOn();
            if(status=='on'){
                dummyMenu.trigger('onselect');
            }
        },4000);
    }

    magicRemote.detectMouseOn = function(dummyMenu){
        clearInterval(this.interval);
        var self = this;
        self.interval = setInterval(function(){
             if(window.NetCastGetMouseOnOff()=='on'){
                clearInterval(self.interval);
                dummyMenu.trigger('onselect');
            }
        },1000);  
    }

    return magicRemote;

    //(window.NetCastGetMouseOnOff() == 'on') ? detectMouseOff() : detectMouseOn();  
    /*var interval;
    var detectMouseOn = function(){
            clearInterval(interval);
            interval = setInterval(function(){
                 if(window.NetCastGetMouseOnOff()=='on'){
                    clearInterval(interval);
                    dummyMenu.trigger('onselect');
                }
            },1000);                        
    }

    var detectMouseOff = function(){
        setTimeout(function(){
            var status = window.NetCastGetMouseOnOff();
            if(status=='off')
                detectMouseOn();
            if(status=='on'){
                dummyMenu.trigger('onselect');
            }
        },4000);
    }*/

})