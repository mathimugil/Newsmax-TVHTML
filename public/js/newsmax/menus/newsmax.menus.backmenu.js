/*
	Need to define ondown in the scene!
*/
define(['navigation', 'stagemanager'], function(Navigation, StageManager) {
	var backMenu = Navigation.Menu.extend({
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
		}
	});

	return backMenu;
});