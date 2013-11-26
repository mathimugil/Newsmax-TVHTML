/* globals console */
define(['underscore'],function(_) {
  return {
    load: function(id, require, load, config) {
      if(config.isBuild) {
        load();
      } else {
<<<<<<< HEAD
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
        else if ( navigator.userAgent.search(/Maple/) > -1 ) {
          require(['enginelite/platforms/enginelite.platform.samsungmodern'], load);
        }
         else if ( navigator.userAgent.search(/AQUOS/) > -1 ) {
          require(['enginelite/platforms/enginelite.platform.sharp'], load);
        } else {
           require(['enginelite/platforms/enginelite.platform.browser'], load);
=======
>>>>>>> development

        var tests = _([
            { test:/GoogleTV/, file: 'enginelite/platforms/enginelite.platform.googletv', name: "Google TV"},
            { test:/LG Browser/, file: 'enginelite/platforms/enginelite.platform.lg', name: "LG"},
            { test:/Viera/,     file: 'enginelite/platforms/enginelite.platform.panasonic', name: "Panasonic"},
            { test:/Maple/, file: 'enginelite/platforms/enginelite.platform.samsungmodern', name: "Samsung"},
            { test:/AQUOS/, file: 'enginelite/platforms/enginelite.platform.sharp', name: "Sharp"}
        ]);

        var test = tests.find(function(t) {
            return  (navigator.userAgent.search(t.test) > -1);
        })
        if(!test) {
            test = {  file: 'enginelite/platforms/enginelite.platform.browser', name: "Browser"}
        }
        console.log("Platform detected: " + test.name + " loading file: " + test.file);

        require([test.file], load);
      }
    }
  }
})
