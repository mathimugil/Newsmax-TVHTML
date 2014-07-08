/*
	Need to define ondown in the scene!
*/
define(['navigation', 'stagemanager'], function(Navigation, StageManager) {
	var backMenu = Navigation.Menu.extend({
		events: {
			/*'mouseover .gridMenuPage:not(".currentRow")' : "showOverlays",
			/*'mouseover #gridMenuContainer' : 'focus',*/
			'mouseover': 'focus',
			'click': '_onSelect',
		},
		initialize: function() {
			Navigation.Menu.prototype.initialize.call(this);
			this.on('onselect', function() {
				$log('back onselect fired');
				StageManager.StageHistory.back();
			}, this);
			this.on('onblur', function() {
				$('.backButton').removeClass('focused');
			}, this);
			this.on('onfocus', function() {
				$('.backButton').addClass('focused');
			}, this);
		},
		_onSelect:function(){
			this.trigger('onselect');
		},
		_onFocus:function(){
			debugger;
		}
 
	});

	return backMenu;
});