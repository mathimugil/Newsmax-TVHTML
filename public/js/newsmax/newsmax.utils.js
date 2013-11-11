define(['backbone', 'mediaplayer'], function(Backbone, MediaPlayer) {
  var catModel = Backbone.Model.extend({});
  return {
    createCollection: function(title) {

      if (!title) title = "test "
      
      var Video = Backbone.Model.extend({
        getPlaylistItem: function() {
          var item = new MediaPlayer.PlaylistItem();
          item.setUrl(this.get('url'));
          return item;
        },
        getPlaylist: function() {
          var playlist = new MediaPlayer.Playlist();
          playlist.addVideo(this.get('url'));
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
      for (var i = 0; i < 24; i++) videos.push(new Video({
        thumb: "http://lorempixel.com/160/" + (90) + "/",
        title: title + i,
        url: 'http://yogaglovideo.s3.amazonaws.com/berg-hd-1200b-2010040902-4-fspass2.mp4'
      }));
      return videos;
    },
    categoryModel: catModel,
    categoryCollection: Backbone.Collection.extend({
      model: catModel
    })
  }
})