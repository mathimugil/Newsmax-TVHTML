define(['navigation', 'enginelite/menuprototypes/enginelite.menus.listmenu', 'hbs!newsmax/templates/MainMenu' ],function(Navigation, ListMenu, MainMenuTemplate){

	var menu = ListMenu.extend({
		render:function(){
			$(this.el).html(MainMenuTemplate({
				categories: this.collection.map(function(e){
					return e.attributes
				})
			}))
		},
		options:{direction:'vertical'}
	})

	return menu;

})