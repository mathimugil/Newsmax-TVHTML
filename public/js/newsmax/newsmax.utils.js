define(['backbone', 'mediaplayer'], function(Backbone, MediaPlayer) {
  var catModel = Backbone.Model.extend({});
  return {
    createCollection: function(title) {
      
      // Note: the way this works is we create a collection when we first launch the application.  Then we update the models of the collection
      // meaning these model methods and collection methods are retained.
      if (!title) title = "test "
      
      var Video = Backbone.Model.extend({
        getPlaylistItem: function() {
          var item = new MediaPlayer.PlaylistItem();
          item.setUrl(this.get('streamUrl'));
          return item;
        },
        getPlaylist: function() {
          var playlist = new MediaPlayer.Playlist();
          playlist.addVideo(this.get('streamUrl'));
          return playlist;
        }
      });
      
      var Videos = Backbone.Collection.extend({
        model: Video,
        getPlaylist: function (){
          var playlist = new MediaPlayer.Playlist();
          this.each(function(item){
            playlist.addItem(item.getPlaylistItem());
          });
          return playlist;
        }
      });

      var videos = new Videos();
      return videos;
    },
    categoryModel: catModel,
    categoryCollection: Backbone.Collection.extend({
      model: catModel
    })
  }
})