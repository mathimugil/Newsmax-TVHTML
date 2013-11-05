/* globals console */
define(function() {
  return {
    load: function(id, require, load, config) {
      if(config.isBuild) {
        load();
      } else {
        var x1 = false;
        if (navigator.appCodeName.search(/Maple/) > -1) {
          require(['enginelite/mediaplayers/enginelite.mediaplayer.samsung'], load);
        } else if (x1) {
          require(['enginelite/mediaplayers/enginelite.mediaplayer.mediaelement'], load);
        } else {
          require(['enginelite/mediaplayers/enginelite.mediaplayer.videotag'], load);
        }
      }
    }
  }
})