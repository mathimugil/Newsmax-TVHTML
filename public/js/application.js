require.config({
    map: {
        '*': {
            platform: 'enginelite/apis/platform!',
            mediaplayer: 'enginelite/apis/mediaplayer!',
            acr: 'enginelite/apis/acr!',
            vastfetcher: 'enginelite/advendors/enginelite.advendors.vast'
        }
    },
    paths: {
        text: 'lib/text',
        hbs: 'lib/hbs',
        'jquery.imagesloaded': 'lib/jqplugins/jquery.imagesloaded',
        'jquery.ellipsis': 'lib/jquery.ellipsis.min',
        'jquery.caret': 'lib/jquery.caret-1.5.2',
        domReady: 'lib/domReady',
        handlebars: 'lib/handlebars-1.0.0',
        tvengine: 'enginelite/tvengine',
        navigation: 'enginelite/enginelite.navigation',
        keyhandler: 'enginelite/enginelite.keyhandler',
        stagemanager: 'enginelite/enginelite.stagemanager',
        utils: 'enginelite/enginelite.utils',
        datastore: 'enginelite/enginelite.datastore',
        appconfig: 'appconfig',
        backbone: 'lib/vendor/backbone/backbone',
        jquery: 'lib/vendor/jquery/jquery',
        underscore: 'lib/vendor/underscore/underscore',
        api: 'newsmax/newsmax.api'
    },
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        handlebars: {
            exports: 'Handlebars'
        },
        'jquery.caret': [
            'jquery'
        ],
        'jquery.imagesloaded': [
            'jquery'
        ],
        'jquery.ellipsis': [
            'jquery'
        ]
    }
});

require(
    [
        'domReady',
        'tvengine',
        'newsmax/newsmax.api',
        'newsmax/scenes/newsmax.scene.main',
        'newsmax/scenes/newsmax.scene.videoplayback',
        'newsmax/scenes/newsmax.scrubber',
        'newsmax/scenes/newsmax.error-modal',
        'jquery.ellipsis',
        'newsmax/newsmax.screenhider',
    ],
    function(domReady, TVEngine, mediaplayer) {
        String.prototype.splice = function( idx, string ) {
            return (this.slice(0,idx) + string  + this.slice(idx));
        };
        String.prototype.delchar = function( idx ) {
            return (this.slice(0,idx) + this.slice(idx + 1));
        };
        domReady(function() {

            window.console.log("here?");
            window.$navigation = require('navigation');
            window.$keyhandler = require("keyhandler");
            window.$stagemanager = require("stagemanager");
            window.$platform = require('platform');
            window.$tvengine = require('tvengine');
            window.$mediaplayer = require('mediaplayer');

            $('#return_button').click(function() {
                $keyhandler.trigger('onReturn');
            });

            var Platform = window.$platform;
            var StageManager = window.$stagemanager;
            var MediaPlayer = window.$mediaplayer;

            TVEngine.on('tvengine:appready', function() {
                $log(" Hi there ...... ");
				
				// Get platform info but don't go crazy trying to recognize everything
				// that's out there.  This is just for the major platforms and OSes.	  
				var platform = Platform.name, ua = navigator.userAgent;

				 // Detect OS 
				var oses = ['Windows','iPhone OS','(Intel |PPC )?Mac OS X','Linux'].join('|');
				var pOS = new RegExp('((' + oses + ') [^ \);]*)').test(ua) ? RegExp.$1 : null;
				if (!pOS) pOS = new RegExp('((' + oses + ')[^ \);]*)').test(ua) ? RegExp.$1 : null;

 			    // Detect browser	  
				var pName = /(Chrome|MSIE|Safari|Opera|Firefox)/.test(ua) ? RegExp.$1 : null;

				// Detect version  
				var vre = new RegExp('(Version|' + pName + ')[ \/]([^ ;]*)');
				var pVersion = (pName && vre.test(ua)) ? RegExp.$2 : null;

				// Detect DeviceID
				var deviceID = Platform.deviceId();
				
				udm_('http' + (document.location.href.charAt(4) == 's' ? 's://sb' : '://b') + '.scorecardresearch.com/b?c1=2&c2=9248945&ns_site=newsmax&name=MainPage&category=live&nmx_site=nmx&nmx_pfm=tv&nmx_sub_category=home&nmx_page_type=vod&version='+pVersion+'&device_type='+platform+'&device_id='+deviceID+'&os='+pOS);
                Platform.on('network:disconnected', function() {
                    if (StageManager.scene.name == 'errormodal') return;
                    StageManager.changeScene('errormodal', {
                        option: 'network'
                    })
                });

                MediaPlayer.on('videoup', function() {
					$log(" Media player ON ...... ");
                });				
            });
            try {
                TVEngine.start();
            } catch (e) {
                $log("Start Error", e)
            }

            window.$globalScreenHider = window.$startScreenHider();

        });
    }, function(e) {
        window.console.log("ERROR", e, e.name, e.message, e.lineNumber);
    }
);