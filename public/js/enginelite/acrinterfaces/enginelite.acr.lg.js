define(['acr','underscore'], function(ACR, _) {
  var lgobject, mediaId, mediaTime;

  var contentChanged = function (id) {
    mediaId = id;
    lgAcr.trigger('contentchanged', id);
  }

  var timeChanged = function (time) {
    mediaTime = time;
    lgAcr.trigger('timeupdate', time);
  }


  var lgAcr = {

    init: function () {
      lgobject = document.getElementById('acr');
      lgobject.onACRContentIdChanged = contentChanged;
      lgobject.onACRTimestampUpdated = timeChanged;
    },

    getCurrentContent: function () {
      mediaId = lgobject.getACRContentInfo();
      return mediaId;
    },

    getCurrentTime: function () {
      return mediaTime;
    },

    setPassiveMode: function (mode) {
      var state = (mode) ? 'idle' : 'active';
      lgobject.setLeanBackState(state);
    },
    getPassiveMode: function () {
      return (lgobject.getLeanBackState() === 'idle');
    }
  }

  _.extend(ACR, lgAcr);

  return ACR;
});