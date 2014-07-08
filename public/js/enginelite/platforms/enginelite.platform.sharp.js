define(['enginelite/enginelite.platform'], function(Platform)  {
  var platform = new Platform('sharp');

  platform.setResolution(1280,720);
  platform.needsProxy = true;
  platform.setMediaPlayer("videotag");


  var fakeLocalStorage = function(){
    var lStorage = {};
    lStorage.setItem = function(key, value) {
        //changed = true;
        this[key] = value;
        //this.saveFile(true);
        return this[key];
    }

    lStorage.getItem = function(key) {
        return this[key];
    }

   return lStorage;
  }

  platform.init = function() {
    window.$storage = fakeLocalStorage();
  }


  platform.deviceId = function() {
    return "aabbaaccsharp";
  }

  platform.deviceType = function() {
    return "TV";
  }
  return platform.start();
});