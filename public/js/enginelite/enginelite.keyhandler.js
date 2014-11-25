/**
 *
 *  Simple TV App Engine KeyHandler
 *
 *  author: A Different Engine LLC.
 *  http://adifferentengine.com
 *  contact@adifferentengine.com
 *
 */
define(['tvengine','platform','jquery','underscore','backbone'], function(TVEngine, Platform, $, _, Backbone) {
		'use strict';

		TVEngine.on("tvengine:starting", function() {
			init();
		});

		var keyActions = {
			KEY_UP: 'onUp',
			KEY_DOWN: 'onDown',
			KEY_LEFT: 'onLeft',
			KEY_RIGHT: 'onRight',
			KEY_ENTER: 'onSelect',
			KEY_RETURN: 'onReturn',
			KEY_STOP: 'onStop',
			KEY_FF: 'onFF',
			KEY_RW: 'onRW', //onRew
			KEY_PLAY: 'onPlay',
			KEY_PAUSE: 'onPause',
			KEY_YELLOW: 'onYellow',
			KEY_RED: 'onRed',
			KEY_BLUE: 'onBlue',
			KEY_GREEN: 'onGreen',
			KEY_EXIT: 'onExit',
			KEY_MENU: 'onMenu',
			KEY_BACK: 'onReturn',
			KEY_SKIPFFORWARD: 'onSkipForward',
			KEY_SKIPBACK: 'onSkipBack',
			KEY_RW2: 'onRW',
			KEY_FF2: 'onFF'
		}

		var keyMap = {}, KeyHandler = {}, 
			allowKeyAction = true,
			delayLength = 150;

		_.extend(KeyHandler, Backbone.Events);

		var init = function() {
			var $KEYS = Platform.keys();

			for (var key in $KEYS) keyMap[$KEYS[key]] = key;

			$(document).bind("keydown", function(event) {
				// if (event.keyCode == 457) document.location.reload(true)
				var action = keyActions[keyMap[event.keyCode]];
				if (typeof action != 'undefined' && allowKeyAction) {
					if (action == 'onReturn') event.preventDefault(); //samsung tv's need for _checkOrBack
					KeyHandler.trigger(action);
					if(event) {
						if(event.stopPropogation) event.stopPropogation();
						if(event.preventDefault) event.preventDefault();
					}
					allowKeyAction = false;
					return false;
				} else {
					return true;
				}
			});

			$(document).bind("keyup", function(event) {
				var action = keyActions[keyMap[event.keyCode]];
				if (typeof action != "undefined") {
					KeyHandler.trigger(action + "Up");
					delayKeyEvents();
					return false;
				} else {
					return true;
				}
			});

			var currentHash = "back."+new Date().getTime();

		};

		/* We simply want to disable obsessive keypressing */
		var delayKeyEvents = function() {
			setTimeout(reinstateKeyActions, delayLength);
		}; 

		/* keydown function sets allowKeyAction to false. we reinstate here */
		var reinstateKeyActions = function() {
			allowKeyAction = true; 
		};
		return KeyHandler;
});

