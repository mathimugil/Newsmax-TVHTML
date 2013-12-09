define(['stagemanager','keyhandler','navigation', 'jquery', 'underscore', 'backbone','platform'], 
	function(StageManager, Keyhandler, Navigation, $, _, Backbone,Platform) {

	
	var scene = new StageManager.Scene({
		defaultScene: false, // Make this our default scene
		name: "errormodal"/*,
		target: "#wrapper",
		view: "views/yogaglo.findaclass.html"*/
	});

	var dummy = new Navigation.Menu();
	var disableBack = false;

	scene.handlesback = function(){
        if(disableBack == true) {
        	Platform.exitToMenu();	// Yogaglo wants the user to be able to exit the application
        	return false;	
        }

        else return true;
    }

	scene.onenterscene = function() {
		$log(" E N T E R I N G ERROR Modal Scene ")

        var option;
        option = "network";
        //option = "system";

	    //TODO: ask mike where we can put this, and does the including Platform give us the equivalent of TVEngine.getPlatform()?
	    //var option = this.persist.params.option;
	    //TODO: incomplete (network is hard coded)

	    $log('binding for paltform network:connected');
        Platform.once('network:connected',function(){
        	$log('network reconnected going to go back in history stack');
            StageManager.StageHistory.back(); 
        },this);

        if(option == "system"){
        	disableBack = false;
        	$('#errorModal').css({'visibility':'visible'});

        	//setup listener to remove network disconnected screen. here.

        }else if(option == "network"){
        	disableBack = true;
        	//$('#networkErrorModal').css({'visibility':'visible'});
        	renderModal('Network Error',"Press OK to exit the application");
        }
		

		dummy.on('onselect',function(){
			Keyhandler.trigger('onReturn');
			//StageManager.StageHistory.back();
		},scene);
		dummy.focus();
	}
	scene.onleavescene = function(){
		$log('L E A V I N G ERROR Modal Scene');
		//$('#errorModal').css({'visibility':'hidden'});
		//$('#networkErrorModal').css({'visibility':'hidden'});
		//$('#smallLoader').hide();
		$("#errormodal").fadeOut();
		dummy.off(null,null,scene);
	}

	var renderModal = function(header, message){
      $("#errormodal h1").empty().html(header);
      $("#errormodal span").empty().html(message);
      $("#errormodal").fadeIn();
    }

	return scene;
});