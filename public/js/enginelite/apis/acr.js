/* globals console */
define(function() {
  return {
    load: function(id, require, load, config) {
      if(config.isBuild) {
        load();
      } else {
        if(navigator.userAgent.search(/LG Browser/) > -1) {
          require(['enginelite/platforms/enginelite.acr.lg'], load);
        } else {
           require(['enginelite/acrinterfaces/enginelite.acr.browser'], load);
        }
      }
    }
  }
})