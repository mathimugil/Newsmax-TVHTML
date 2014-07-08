/* globals Common, $W, FileSystem, curWidget */
// (function() { 
//     var global = this;
// })();
define(['jquery', 'underscore', 'backbone', 'tvengine', 'enginelite/enginelite.platform', 'domReady'], function($, _, Backbone, TVEngine, Platform, domReady) {
    
    $("#videoDebug").append($('<div>adding samsung platform<div>'))
    console.log("CREATING SMSUNG PLATFORM ");
    var platform = new Platform('Samsung');
    platform.setResolution(1280, 720);
    platform.needsProxy = false;

    //setting this to true will disable alert logging on samsung
    platform._disableAlerts = false;

    console.log(" COMMON? ", window.Common);
    platform.keys = function() {
        try {
            var samsungKeys = new window.Common.API.TVKeyValue();
        } catch (e) {
            console.log(" COMMON? ", window.Common);
        }
        var moreKeys = {
            'KEY_RW2': 1080,
            'KEY_FF2': 1078
        };

        var keys = $.extend({}, samsungKeys, moreKeys);
        $log('keys are below');
        $.each(keys, function(key, value) {
            $log(key + ": " + value);
        });
        return keys;
    }
    platform.setMediaPlayer("samsungnative");
    platform.exitToTv = function() {
        $log(" CALLING SAMSUNG sendExitEvent EVENT ");
        this._exitCoordinates = this._defaultCoordinates;

        //Calling plugin Stop before calling sendExitEvent because it was causing an error on 2011.
        var plugin = document.getElementById("pluginPlayer");
        plugin.Stop();

        $W.sendExitEvent();
    };
    platform.exitToMenu = function() {
        $log(" CALLING SAMSUNG sendReturnEvent EVENT ")
        this._exitCoordinates = this._returnCoordinates;

        //Calling plugin Stop before calling sendReturnEvent because it was causing an error on 2011
        var plugin = document.getElementById("pluginPlayer");
        plugin.Stop();
        $W.sendReturnEvent();
    };
    platform.init = function() {
        TVEngine.on('exit', function() {
            this.exitToTv();
        }, this);
        TVEngine.on('exittomenu', function() {
            this.exitToMenu();
        }, this);
        if (typeof(Common) != 'undefined') {
            window.$W = new Common.API.Widget();
        }
        TVEngine.bind("tvengine:appready", function() {
            console.log('tvengine:appready caled');
            $W.sendReadyEvent();
        });


        // samsung local stoage implementation
        var fileSyObj = new FileSystem();

        var bValid = fileSyObj.isValidCommonPath(curWidget.id);
        if(!bValid){
            // Need to create new directory for local user data
            //$log("bValid = false");
            fileSyObj.createCommonDir(curWidget.id);
        }else{
            //$log("bValid = true");
        }

        var fileName = curWidget.id + "/_localStorage.db";
        //$log('filename = ' + fileName);
        var lStorage = {};
        var changed = false;

        // load or init localStorage file
        var fileObj = fileSyObj.openCommonFile(fileName, "r+");
        if (fileObj != null) {
            //$log('fileObj != null');
            //$log(fileObj.readAll());
            try {
                lStorage = JSON.parse(fileObj.readAll());
            } catch (e) {}
        } else {
            //$log('fileObj == null');
            fileObj = fileSyObj.openCommonFile(fileName, "w")
            fileObj.writeAll("{}");
        }
        fileSyObj.closeCommonFile(fileObj);

        // Save storage
        lStorage.saveFile = function(delay) {
            if (changed && typeof JSON == 'object') {
                var $self = this;
                var save = function() {
                    fileObj = fileSyObj.openCommonFile(fileName, "w")
                    fileObj.writeAll(JSON.stringify($self));
                    fileSyObj.closeCommonFile(fileObj);
                    changed = false;
                }
                if (typeof delay != 'undefined' && delay)
                    setTimeout(save, 100);
                else
                    save();
            }
        }

        lStorage.setItem = function(key, value) {
            changed = true;
            this[key] = value;
            this.saveFile(true);
            return this[key];
        }

        lStorage.removeItem = function(key){
            changed = true;
            delete this[key];
            this.saveFile(true);
        }

        lStorage.getItem = function(key) {
            return this[key];
        }
        /*lStorage.clear = function(){
                var save = function() {
                    fileObj = fileSyObj.openCommonFile(fileName, "w")
                    fileObj.writeAll("{}");
                    fileSyObj.closeCommonFile(fileObj);
                    //changed = false;
                }
                setTimeout(save, 100);

                var read = function(){
                    fileObj = fileSyObj.openCommonFile(fileName, "w")
                    $log('fileObj.readAll() is below');
                    $log(fileObj.readAll());
                    fileSyObj.closeCommonFile(fileObj);
                }
                setTimeout(read,5000);

        }*/

        window.$storage = lStorage;
        console.log('arrived to $storage = ');


        return this;
    } //end init
    
    platform.tvCoordinates = {
        x: 0,
        y: 0,
        width: 1280,
        height: 720
    }

    platform._defaultCoordinates = {
        x: 0,
        y: 0,
        width: 960,
        height: 540
    }

    platform._returnCoordinates = {
        x: 0,
        y: 0,
        width: 960,
        height: 540
    }

    platform._exitCoordinates = {
        x: 0,
        y: 0,
        width: 960,
        height: 540
    }

    platform.startup = function() {
        var _t = this;
        var showHandler = function() {
            try {
                var pluginAPI = new Common.API.Plugin();
                var tvKey = new Common.API.TVKeyValue();
                
                pluginAPI.unregistKey(tvKey.KEY_VOL_UP);
                pluginAPI.unregistKey(tvKey.KEY_VOL_DOWN);
                pluginAPI.unregistKey(tvKey.KEY_MUTE);
                pluginAPI.unregistKey(tvKey.KEY_INFOLINK); //smart hub?
                pluginAPI.unregistKey(tvKey.KEY_WLINK); //smart hub?
                pluginAPI.unregistKey(tvKey.KEY_CONTENT);
                pluginAPI.unregistKey(tvKey.KEY_MENU);
                pluginAPI.unregistKey(tvKey.KEY_SOURCE);


                NNaviPlugin = document.getElementById("pluginObjectNNavi");
                NNaviPlugin.SetBannerState(1); // 1 means Volume and Mute 2 = channels can be controlled...

                _t._modifyTVResolution = function() {
                    var goodCoords = true;
                    _.each(_t.tvCoordinates, function(v) {
                        if (!_.isNumber(v)) goodCoords = false;
                    })

                    var arr = document.getElementById("pluginWindow").GetScreenRect().split("/");
                    var hash = {
                        x: parseInt(arr[0], 10),
                        y: parseInt(arr[1], 10),
                        width: parseInt(arr[2], 10),
                        height: parseInt(arr[3], 10)
                    };

                    _t._returnCoordinates = hash;
                    $log('setting _returnCoordinates to hash: ' + _.values(hash))

                    $(window).bind('unload', function() {
                        try {
                            var windowPlugin;

                            $log(' [UNLOAD CALLED] ');

                            windowPlugin = document.getElementById("pluginWindow");

                            $log(' SETTING coordinates to ' + 'x: ' + _t._exitCoordinates.x + ' y: ' + _t._exitCoordinates.y + ' width: ' + _t._exitCoordinates.width + ' height: ' + _t._exitCoordinates.height);

                            windowPlugin.SetScreenRect(_t._exitCoordinates.x, _t._exitCoordinates.y, _t._exitCoordinates.width, _t._exitCoordinates.height);

                            $log(' Getting coordinates from tv after setting them ' + document.getElementById("pluginWindow").GetScreenRect());

                            //TVEngine.MediaPlayer.stop();
                            clearInterval(_t.checkInternetInterval);

                        } catch (e) {
                            $log(' ON UNLOAD RESET CALLED BUT ERRORED!');
                        }
                    });

                    if (_.isEqual(hash, _t.tvCoordinates)) return;

                    if (!goodCoords) {
                        //$rlog(" TRIED TO SET TV RESOLUTION TO BAD COORDINATES ", _t.tvCoordinates);
                        return;
                    }

                    var windowPlugin = document.getElementById("pluginWindow");
                    try {
                        $log(' SETTING coordinates to ' + 'x: ' + _t.tvCoordinates.x + ' y: ' + _t.tvCoordinates.y + ' width: ' + _t.tvCoordinates.width + ' height: ' + _t.tvCoordinates.height);
                        windowPlugin.SetScreenRect(_t.tvCoordinates.x, _t.tvCoordinates.y, _t.tvCoordinates.width, _t.tvCoordinates.height);
                        $log(' Getting coordinates from tv after setting them ' + document.getElementById("pluginWindow").GetScreenRect());
                    } catch (e) {
                        $log(" ERROR SETTING SCREEN DIMENSIONS " + e);
                        $log(" SETTING TO DEFAULT 1280x720");
                        windowPlugin.SetScreenRect(0, 0, 1280, 720);
                    }
                }
                _t._modifyTVResolution();

 

                /*var networkPlugin = document.getElementById('pluginObjectNetwork');
                var internetConnectionInterval = 2000;

                function checkConnection() {
                    var physicalConnection = 0,
                        httpStatus = 0;
                    var currentInterface = networkPlugin.GetActiveType();

                    // If no active connection.
                    if (currentInterface === -1) {
                        return false;
                    }

                    // Check physical connection of current interface.
                    physicalConnection = networkPlugin.CheckPhysicalConnection(currentInterface);

                    // If not connected or error.
                    if (physicalConnection !== 1) {
                        return false;
                    }

                    // Check HTTP transport.
                    httpStatus = networkPlugin.CheckHTTP(currentInterface);

                    // If HTTP is not avaliable.
                    if (httpStatus !== 1) {
                        return false;
                    }

                    // Everything went OK.
                    return true;
                }

                function cyclicInternetConnectionCheck() {
                    if (!checkConnection()) {
                        // no internet connection
                        platform.trigger('network:disconnected');

                    } else {
                        // internet connection
                        platform.trigger('network:connected');
                    }
                }

                setInterval(function() {
                    cyclicInternetConnectionCheck()
                }, internetConnectionInterval);*/


                /*MediaPlayer.bind('mediaplayer:onplay mediaplayer:onresume',function(){
                        pluginAPI.setOffScreenSaver();
                        $rlog("MediaPlayer event playing video -> pluginAPI.setOffScreenSaver()")
                    });

                    MediaPlayer.bind('mediaplayer:onpause mediaplayer:onstop mediaplayer:mediaend',function(){
                        pluginAPI.setOnScreenSaver();
                        $rlog("MediaPlayer event playing video -> pluginAPI.setOnScreenSaver()")
                    });*/

            } catch (e) {
                $log(" ----- ERROR WITH ON SHOW HANDLER ----- " + e);
            }
        }
        window.onShow = showHandler;
    } //end platform start

    platform.startNetworkCheck = function() {
        $("#videoDebug").append($('<div>running platform startNetworkCheck for samsung<div>'))
        var networkPlugin = document.getElementById('pluginObjectNetwork');
        var internetConnectionInterval = 2000;
        var _t = this;
        function checkConnection() {
            var physicalConnection = 0,
                httpStatus = 0;

            // Get active connection type - wired or wireless.
            currentInterface = networkPlugin.GetActiveType();

            // If no active connection.
            if (currentInterface === -1) {
                return false;
            }

            // Check physical connection of current interface.
            physicalConnection = networkPlugin.CheckPhysicalConnection(currentInterface);

            // If not connected or error.
            if (physicalConnection !== 1) {
                return false;
            }

            // Check HTTP transport.
            httpStatus = networkPlugin.CheckHTTP(currentInterface);

            // If HTTP is not avaliable.
            if (httpStatus !== 1) {
                return false;
            }

            // Everything went OK.
            return true;
        }

        
        clearInterval(_t.checkInternetInterval);
        
        _t.checkInternetInterval = setInterval(function() {
            if (!checkConnection()){
              platform.trigger('network:disconnected');  
            } 
            else {
             platform.trigger('network:connected');   
            }
        }, internetConnectionInterval);
    }

    platform.deviceId = function() {
        var NetworkPlugin = document.getElementById('pluginObjectNetwork'),
            NNaviPlugin = document.getElementById('pluginObjectNNavi');
        var MAC = NetworkPlugin.GetMAC(0);
        return NNaviPlugin.GetDUID(MAC);
    }

    platform.deviceType = function() {
        var productHash = {
            0: 'TV',
            1: 'MONITOR',
            2: 'DVD/BD'
        }
        var tvPlugin = document.getElementById('pluginObjectTV');
        var productType = tvPlugin.GetProductType();

        //$log('Device type: ' + tvPlugin.GetProductType());
        var NNaviPlugin = document.getElementById('pluginObjectNNavi');
        var gm = NNaviPlugin.GetModelCode();

        return ("Manufacturer: Samsung / Model: " + gm + " / Device Type: " + productHash[productType]);

    }
    domReady(function() {
        $("#videoDebug").append($('<div>running platform.startup() on domReady<div>'))
        platform.startup();
    })
    platform.init();
    return platform.start();
});

