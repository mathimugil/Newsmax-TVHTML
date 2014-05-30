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

To capture media player events you need a reference to the MediaPlayer. The simplest place to get that reference is probably in the application.js file, there's already a "MediaPlayer" reference that you can use.

You then can bind to the MediaPlayer for events. These events use the Backbone Events system:

http://backbonejs.org/#Events

To see all the events (all is a reserved word for 'all' events)
MediaPlayer.on('all', function(event, params) {
  console.log('event: ' + event + ' - params: ', params)
})

To capture an individual event

MediaPlayer.on('timeupdate', function(time) {
  console.log('Current MediaTime: ' + time);



