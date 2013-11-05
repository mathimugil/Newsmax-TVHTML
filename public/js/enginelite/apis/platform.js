/* globals console */
define(function() {
  return {
    load: function(id, require, load, config) {
      if(config.isBuild) {
        load();
      } else {
        if(window.boxee) {
          require(['enginelite/platforms/enginelite.platform.boxee'], load);
        }
        else if ( navigator.userAgent.search(/GoogleTV/)  > -1) {
          require(['enginelite/platforms/enginelite.platform.googletv'], load);
        }
        else if ( navigator.userAgent.search(/LG Browser/) > -1 ) {
          require(['enginelite/platforms/enginelite.platform.lg'], load);
        }
        else if ( navigator.userAgent.search(/Viera/) > -1 ) {
          require(['enginelite/platforms/enginelite.platform.panasonic'], load);
        }
        else if ( navigator.appCodeName.search(/Maple/) > -1 ) {
          require(['enginelite/platforms/enginelite.platform.samsungmodern'], load);
        }
         else if ( navigator.userAgent.search(/AQUOS/) > -1 ) {
          require(['enginelite/platforms/enginelite.platform.sharp'], load);
        } else {
           require(['enginelite/platforms/enginelite.platform.browser'], load);

        }
      }
    }
  }
})