define(['backbone'], function(Backbone) {
  var catModel = Backbone.Model.extend({});
  return {
    createCollection: function(title) {

      if (!title) title = "test "
      var Video = Backbone.Model.extend({});
      var Videos = Backbone.Collection.extend({
        model: Video
      });

      var videos = new Videos();
      for (var i = 0; i < 24; i++) videos.push(new Video({
        thumb: "http://lorempixel.com/200/" + (150) + "/",
        title: title + i
      }));
      return videos;
    },
    categoryModel: catModel,
    categoryCollection: Backbone.Collection.extend({
      model: catModel
    })
  }
})