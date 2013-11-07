/*
	Main Navigation Object, it does a few things

	1. Registers for key events.
	2. Enables and Disables Navigation
	3. Manages Menus

*/

define(['keyhandler', 'jquery', 'underscore', 'backbone'], function(KeyHandler, $, _, Backbone) {
	'use strict';
	var Navigation = {
		enabled: true,
		_eventsIHandle: ['onright', 'onleft', 'onup', 'ondown', 'onselect'],

		enable: function() {
			this.enabled = true;
		},

		disable: function() {
			this.enabled = false;
		},

		start: function() {
			this.currentMenu.setFocused();
			this.enable();
		},


		// Send the key event to the current menu.
		eventHandler: function(event) {
			event = event.toLowerCase();
			if (!this.enabled) return;
			if (this.currentFocus && _.include(this._eventsIHandle, event)) {
				this.currentFocus.menu.trigger(event);
			} else if (!this.currentFocus) {
				$error("<<< NO CURRENT MENU SET >>>");
			}
		},

		setFocus: function(menu, skipHistory) {
			if (this.currentFocus && this.currentFocus.menu && this.currentFocus.menu == menu) return;
			if (this.currentFocus) {
				this.currentFocus.menu.trigger('onblur');
				if (!this.currentFocus.skipHistory) this.History.addItem(this.currentFocus.menu);
			}

			this.currentFocus = {
				menu: menu,
				storeInHistory: skipHistory
			}
			this.currentFocus.menu.trigger('onfocus');
		},

		back: function() {
			var last = this.History.last();
			if (last && !_.isEmpty(last)) this.setFocus(last);
		},

		History: {
			maxStackLength: 50,
			_stack: [],
			addItem: function(item) {
				if (!item) return;
				if (this._stack.length == this.maxStackLength) this._stack.shift();
				this._stack.push(item);
			},
			last: function() {
				return this._stack.pop();
			},
			clear: function() {
				this._stack = [];
			}
		}
	};

	KeyHandler.on('all', Navigation.eventHandler, Navigation);

	Navigation.Menu = Backbone.View.extend({
		focused: false,
		initialize: function() {
            Backbone.View.prototype.initialize.apply(this, arguments);
			this.off('onfocus onblur', null, this);
			this.on('onfocus', function() {
				this.focused = true;
			}, this);
			this.on('onblur', function() {
				this.focused = false;
			}, this);
		},
		focus: function() {
			Navigation.setFocus(this);
            return this;
		}
	});
	return Navigation;
})
