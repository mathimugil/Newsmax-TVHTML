define(['enginelite/enginelite.platform'], function(Platform)  {
  var platform = new Platform('panasonic');
  platform.setResolution(1280, 720);
  //platform.needsProxy = true;
  platform.needsProxy = true;
  platform.setMediaPlayer("videotag");
  platform.keys = function() {
    return {
      KEY_RETURN: 36,
      KEY_UP: 38,
      KEY_DOWN: 40,
      KEY_LEFT: 37,
      KEY_RIGHT: 39,
      KEY_ENTER: 13,
      KEY_RED: 65,
      KEY_GREEN: 66,
      KEY_YELLOW: 67,
      KEY_BLUE: 68,
      KEY_BACK: 8,
      KEY_PLAY: 80
    }
  }

  platform.init = function() {
    this._setupLocalStorage();
  }

  platform.deviceId = function() {
    //var device =  document.getElementById("panasonic-device");
    //return device.serialNumber;
    return "aabbaacc";
  }

  platform.deviceType = function() {
    //var device =  document.getElementById("panasonic-device");
    //return device.manufacturer + "  - " + device.modelName;
    return "TV";
  }

  platform._setupLocalStorage = function() {
    var Storage = function(type) {
      function createCookie(name, value, days) {
        var date, expires;

        if (days) {
          date = new Date();
          date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
          expires = "; expires=" + date.toGMTString();
        } else {
          expires = "";
        }
        document.cookie = name + "=" + value + expires + "; path=/";
      }

      function readCookie(name) {
        var nameEQ = name + "=",
          ca = document.cookie.split(';'),
          i, c;

        for (i = 0; i < ca.length; i++) {
          c = ca[i];
          while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
          }

          if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
          }
        }
        return null;
      }

      function setData(data) {
        data = JSON.stringify(data);
        if (type == 'session') {
          window.name = data;
        } else {
          createCookie('localStorage', data, 365);
        }
      }

      function clearData() {
        if (type == 'session') {
          window.name = '';
        } else {
          createCookie('localStorage', '', 365);
        }
      }

      function getData() {
        var data = type == 'session' ? window.name : readCookie('localStorage');
        return data ? JSON.parse(data) : {};
      }


      // initialise if there's already data
      var data = getData();

      return {
        length: 0,
        clear: function() {
          data = {};
          this.length = 0;
          clearData();
        },
        getItem: function(key) {
          return data[key] === undefined ? null : data[key];
        },
        key: function(i) {
          // not perfect, but works
          var ctr = 0;
          for (var k in data) {
            if (ctr == i) return k;
            else ctr++;
          }
          return null;
        },
        removeItem: function(key) {
          delete data[key];
          this.length--;
          setData(data);
        },
        setItem: function(key, value) {
          data[key] = value + ''; // forces the value to a string
          this.length++;
          setData(data);
        }
      };
    };

    window.$storage = new Storage('local');
  }

  return platform.start();
});