/* globals console */
define(['underscore'],function(_) {
  return {
    load: function(id, require, load, config) {
      if(config.isBuild) {
        load();
      } else {

        var tests = _([
            { test:/GoogleTV/, file: 'enginelite/platforms/enginelite.platform.googletv', name: "Google TV"},
            { test:/LG Browser/, file: 'enginelite/platforms/enginelite.platform.lg', name: "LG"},
            { test:/Viera/,     file: 'enginelite/platforms/enginelite.platform.panasonic', name: "Panasonic"},
            { test:/Maple/, file: 'enginelite/platforms/enginelite.platform.samsungmodern', name: "Samsung"},
            { test:/AQUOS/, file: 'enginelite/platforms/enginelite.platform.sharp', name: "Sharp"},
            { test:/Opera TV Store/, file: 'enginelite/platforms/enginelite.platform.opera', name: "Opera"}
        ]);

        var test = tests.find(function(t) {
            return  (navigator.userAgent.search(t.test) > -1);
        })
        if(!test) {
            test = {  file: 'enginelite/platforms/enginelite.platform.browser', name: "Browser"}
        }
        //$("#errorField").append($('<div>'+"Platform detected: " + test.name + " loading file: " + test.file+'</div>'));
        console.log("Platform detected: " + test.name + " loading file: " + test.file);

        require([test.file], load);
      }
    }
  }
})
