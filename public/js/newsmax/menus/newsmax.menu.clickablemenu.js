/*
	Need to define ondown in the scene!
*/
define(['navigation', 'stagemanager'], function(Navigation, StageManager) {
	var menu = Navigation.Menu.extend({
		events: {
			'mouseover': 'focus',
			'click': '_onSelect',
		},
		initialize: function() {
			Navigation.Menu.prototype.initialize.call(this);
		},
		_onSelect:function(){
			this.trigger('onselect');
		}
	});

	return menu;
});