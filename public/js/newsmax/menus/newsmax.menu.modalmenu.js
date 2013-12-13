/*
	Need to define ondown in the scene!
*/
define(['navigation', 'stagemanager'], function(Navigation, StageManager) {
	var ModalMenu = Navigation.Menu.extend({
		initialize: function() {
			Navigation.Menu.prototype.initialize.call(this);
			this.on('onselect', function() {
				$log('back onselect fired');
        $("#errormodal").fadeOut();
        StageManager.StageHistory.back();
			}, this);
			this.on('onfocus', function() {
				$('.errorButton').addClass('focused');
			}, this);
		}
	});

	return ModalMenu;
});