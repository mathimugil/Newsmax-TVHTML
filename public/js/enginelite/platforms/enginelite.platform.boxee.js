
define(['enginelite/enginelite.platform', 'jquery', 'domReady'], function(Platform, $, domReady) {
  var defineBoxeeControlFunctions = function() {
    function setApiMinVersion(args) {
      var version = args[0];
      window.boxee.apiMinVersion = version || 7.0;
    }

    window.boxee.exec(setApiMinVersion);

    function showNotification(args) {
      var message = args[0];
      var thumbUrl = args[1] || '.';
      var duration = args[2] || 2;

      window.boxee.showNotification(message, thumbUrl, duration);
    }
    window.boxee.exec(showNotification);

    function cursorMode() {
      window.boxee.setMode(window.boxee.CURSOR_MODE);
    }
    window.boxee.exec(cursorMode);

    function keyboardMode() {
      window.boxee.setMode(window.boxee.KEYBOARD_MODE);
    }
    window.boxee.exec(keyboardMode);

    function getHttp(args) {
      var url = args[0];
      return window.boxee.getHttp(url);
    }
    window.boxee.exec(getHttp);

    function openDialogCallback(confirmed) {
      window.boxee.showNotification("in openDialogCallback " + window.boxee.browserCallback);
      //browser.execute("window.hi('" + boxee.browserCallback + "(" + confirmed + ")')");
      window.browser.execute("window." + window.boxee.browserCallback + "(" + confirmed + ")");
    }
    window.boxee.exec(openDialogCallback);

    function promptDialog(args) {
      var title = args[0];
      var moreText = args[1] || '';

      window.boxee.browserCallback = args[2];

      window.boxee.openDialog("YesNo", title, moreText, 'openDialogCallback');
    }
    window.boxee.exec(promptDialog);
  }



  window.boxeeAPI = {

    notify: function(message, seconds) {
      seconds = seconds ? seconds : 2;
      var json = JSON.stringify([message, ".", seconds]);
      window.boxee.exec('showNotification(' + json + ')');
    },
    closeBrowser: function() {
      window.boxee.exec("browser.shutdown()");
    },
    closeApp: function() {
      window.boxee.exec("browser.shutdown()");
    },
    showBoxeeOSD: function() {
      window.boxee.exec("boxee.showBoxeeOSD()");
    },
    getURL: function(url, callback) {
      return $.Deferred(function(dfd) {
        var json = JSON.stringify([url]);
        var data = window.boxee.exec2("getHttp(" + json + ")");
        setTimeout(function() {
          dfd.resolve();
          callback(data);
        }, 0);
      }).promise();
    },
    clearPauseOverlay: function() {
      window.boxee.exec("playerState.isPaused = false;");
    },
    showPauseOverlay: function() {
      window.window.boxee.exec("playerState.isPaused = true;");
    },
    keyboardMode: function() {
      window.boxee.exec("keyboardMode()");
    },
    cursorMode: function() {
      window.boxee.exec("cursorMode()");
    },
    showNotification: function() {
      var array = Array.prototype.slice.call(arguments);
      var json = JSON.stringify(array);
      window.boxee.exec("showNotification(" + json + ")");
    },
    promptDialog: function(title, moreText, callback) {
      var json;
      if (typeof callback === 'function') {
        window.boxee.promptDialogCallback = function(confirmed) {
          callback(confirmed);
        }
        json = JSON.stringify([title, moreText, 'boxee.promptDialogCallback']);
        window.boxee.exec("promptDialog(" + json + ")");
      } else if (typeof callback === 'string') {
        var array = Array.prototype.slice.call(arguments);
        json = JSON.stringify(array);
        window.boxee.exec("promptDialog(" + json + ")");
      }
    }
  }

  var platform = new Platform('boxee');
  platform.setResolution(1280, 720);
  platform.needsProxy = true;
  defineBoxeeControlFunctions();

  window.boxee.renderBrowser = false;
  window.boxee.browswerWidth = 1280;
  window.boxee.browserHeight = 720;
  $(window).unload(function() {
    window.boxee.clearPauseOverlay()
  });

  domReady(function() {
    $log(" SEtting keyboard Mode !!! ");
    window.boxeeAPI.keyboardMode();
    var xoffset = Math.floor((screen.width - 1280) / 2);
    var yoffset = Math.floor((screen.height - 720) / 2);
    $("#innerBody").css({
      left: "+=" + xoffset,
      top: "+=" + yoffset
    })
  });

  return platform.start();
});