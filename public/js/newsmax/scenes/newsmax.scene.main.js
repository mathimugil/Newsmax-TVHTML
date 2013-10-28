
define([
            'stagemanager'
          , 'navigation'
          , 'hbs!newsmax/templates/Sample' ],
            function(StageManager, Navigation, sampleTemplate ) {

  'use strict';

  var scene = new StageManager.Scene({
    defaultScene: true, // Make this our default scene
    name: "main", target: "#wrapper", view: "views/newsmax.main.html"
  });

  scene.onenterscene = function () {
    $("#main").html(sampleTemplate({
      AppTitle: "NewsMax"
    }));
  }

  return scene;
});