define(['underscore', 'backbone','tvengine'], function(_, Backbone, TVEngine) {
  var ACR = {
    init: function() {}, // Placeholder
  };
  _.extend(ACR, Backbone.Events);
  TVEngine.on('tvengine:appready', function() {
    ACR.init();
  });
  return ACR;
});