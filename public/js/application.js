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
                Platform.on('network:disconnected', function() {
                    if (StageManager.scene.name == 'errormodal') return;
                    StageManager.changeScene('errormodal', {
                        option: 'network'
                    })
                });

                MediaPlayer.on('videoup', function() {
                    $('body').css('background', 'transparent');
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