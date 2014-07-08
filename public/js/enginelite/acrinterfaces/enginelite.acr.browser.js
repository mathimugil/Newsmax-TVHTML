define(['acr','underscore'], function(ACR,_) {
  var mediaTime = 1000;
  var mediaInterval = 1000;

  var browserAcr = {
    _interval: null, _passiveMode: false, _id: null,

    init: function () {
      setInterval( function () {
        updateTime();
      }, mediaInterval)
    },

    stop: function () {
      clearInterval(this._interval);
    },

    getCurrentContent: function () {
      return this._id;
    },

    getCurrentTime: function () {
      return mediaTime;
    },

    setPassiveMode: function (mode) {
      this._passiveMode = mode;
    },
    getPassiveMode: function () {
      return this._passiveMode;
    },
    _changeContent: function (id) {
      this._id = id;
      this.trigger('contentchange', id);
    }
  }

  var updateTime = function () {
    browserAcr.trigger('timeupdate', mediaTime+=1000);
  }

  _.extend(ACR, browserAcr);

  return ACR;
});