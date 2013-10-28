require.config({

  map: {
    '*': {
      'platform':'enginelite/apis/platform!',
      'mediaplayer':'enginelite/apis/mediaplayer!',
      'acr':'enginelite/apis/acr!',
      'vastfetcher':'enginelite/advendors/enginelite.advendors.vast'
    }
  },

  paths: {
    text:                       'lib/text',
    hbs:                        'lib/hbs',
    domReady:                   'lib/domReady',
    handlebars:              'lib/handlebars-1.0.0',
    tvengine:                   'enginelite/tvengine',
    navigation:                 'enginelite/enginelite.navigation',
    keyhandler:                 'enginelite/enginelite.keyhandler',
    stagemanager:               'enginelite/enginelite.stagemanager',
    utils:                      'enginelite/enginelite.utils',
    datastore:                  'enginelite/enginelite.datastore',
    appconfig:                  'appconfig'
  },

  shim: {
    'underscore': {
      exports: '_'
    },
    'backbone': {
      deps:['underscore','jquery'],
      exports: 'Backbone'
    },
    'handlebars': {
      exports: 'Handlebars'
    }
  }
});

require(
  [
    'domReady',
    'tvengine',
    'newsmax/scenes/newsmax.scene.main'
  ],
  function ( domReady, TVEngine) {
    domReady(function() {
      TVEngine.start();
    });
  }, function(e) {
    window.console.log(" HERE? ERROR", e,  e.stack);
  }
);