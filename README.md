# Newsmax-TVHTML

##Newsmax TVHTML App

###Running Locally
Newsmax HTML App expects to run locally on [node.js] (http://www.nodejs.org) and [grunt] (http://gruntjs.com/). Install node by homebrew (or similar) from the app directory:

  -- brew install node

Install npm, if necessary:

  -- curl https://npmjs.org/install.sh | sh

Install Grunt globally with npm:

  -- npm install -g grunt -cli
  
To start up your server, run `grunt server:dev`

###MediaPlayer Events

To capture media player events you need a reference to the MediaPlayer. The simplest place to get that reference is probably in the application.js file, there's already a "MediaPlayer" reference that you can use.  A note about how we play video.  Everything we play is part of a playlist, even if that playlist is only a single video. Therefore some of the media events are playlist events. 

You then can bind to the MediaPlayer for events. These events use the Backbone Events system:

http://backbonejs.org/#Events

To see all the events (all is a reserved word for 'all' events). To figure this all out the best thing to do is run this and watch your console

```
MediaPlayer.on('all', function(event, params) {
  console.log('event: ' + event + ' - params: ', params)
})
```

To capture an individual event.

```
MediaPlayer.on('timeupdate', function(time) {
  console.log('Current MediaTime: ' + time);
}
```

Take a look at the Backbone Docs on how the events work. There's two common errors made. First is binding multiple times to the same event. The second is accidently unbinding other events. A Safe way to call this is

```
var myEventHandler = function() {
  console.log('My Event')
}
MediaPlayer.off('myevent', myEventHandler);
MediaPlayer.on('myevent', myEventHandler);
```

This prevents bining multiple times to 'myevent' and wont unbind anything else bound to 'myevent'.


Events|Parameter|Note
------|------|-------
timeupdate|Current Playback time
bufferingstart||
bufferingend||
videoend||Video has ended
play||Play has been called on video
pause||Pause has been called on video
videoerror||Error has occured
playlist:nextvideo||Looking for next video in playlist
playlist:ended||Playlist is done
playlist:newplaylistitem||Next playlist item found
onnewplaylist||Playlist has changed


