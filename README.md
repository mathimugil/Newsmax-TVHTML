# Newsmax-TVHTML

##Newsmax TVHTML App

###Running Locally on OS X or Ubuntu
Newsmax HTML App expects to run locally on [node.js] (http://www.nodejs.org) and [grunt] (http://gruntjs.com/). Install node by homebrew (or similar) from the app directory:

  -- brew install node

Install npm, if necessary:

  -- curl https://npmjs.org/install.sh | sh

Install Grunt globally with npm:

  -- npm install -g grunt -cli
  
To start up your server, run `grunt server:dev`

###Running Locally on Windows
Newsmax can be run on Windows but with a few different steps.

1. You need to host the contents of the "public" directory on a webserver (Apache or IIS should work)

Right now the app will not work because it can't make Cross Domain AJAX calls. To enable this you need to edit line 11 in public/newsmax/newsmax.api.js

Change:

```
skipProxy: (document.location.href.indexOf("nmax") > 0 || !Platform.needsProxy)
```

to 
```
skipProxy: true
```

Now you need to run Chrome with web security disabled.  To do this you need to launch Chrome with the --disable-web-security argument;

1. Create A Shortcut to Chrome on your desktop.
1. Right Click the Shortcut and select "Properties"
2. Edit the "target path" (adjust path too chrome.exe if needed)
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --args --disable-web-security
```

Run Chrome and view the hosted application and it should work.

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


