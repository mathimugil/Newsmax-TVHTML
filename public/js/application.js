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
    'jquery.loadingdotdotdot': 'lib/jquery.loadingdotdotdot',
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
    'jquery.imagesloaded': [
      'jquery'
    ],
    'jquery.ellipsis': [
      'jquery'
    ],
    'jquery.loadingdotdotdot': [
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
    'jquery.ellipsis',
    'jquery.loadingdotdotdot',
  ],
  function ( domReady, TVEngine) {
    domReady(function() {

    window.$navigation    = require('navigation');
    window.$keyhandler    = require("keyhandler");
    window.$stagemanager  = require("stagemanager");
    window.$platform      = require('platform');

    $('#return_button').click(function(){
      $keyhandler.trigger('onReturn');
    });

      TVEngine.start();
    });
  }, function(e) {
    window.console.log(" HERE? ERROR", e,  e.stack);
  }
);