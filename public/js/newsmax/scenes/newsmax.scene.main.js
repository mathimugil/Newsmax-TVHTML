define([
    'stagemanager', 'navigation', 'backbone', 'hbs!newsmax/templates/Sample', 'newsmax/menus/newsmax.menu.mainmenu', 'hbs!newsmax/templates/MainMenu', 'enginelite/menuprototypes/enginelite.menus.gridmenu', 'enginelite/menuprototypes/enginelite.menus.listmenu', 'newsmax/newsmax.mainmenu', 'newsmax/newsmax.utils'
  ],
  function(StageManager, Navigation, BackBone, sampleTemplate, MainMenu, MainMenuTemplate, GridMenu,ListMenu, MenuItems, Utils) {

    'use strict';

    var scene = new StageManager.Scene({
      defaultScene: true, // Make this our default scene
      name: "main",
      target: "#wrapper",
      view: "views/newsmax.main.html"
    });

    scene.onenterscene = function() {



      var mainMenu = new ListMenu({
        el: '#mainMenu',
        collection: MenuItems,
        template: MainMenuTemplate,
        direction: 'vertical',
      });

      $log(" MAIN MENU ", mainMenu);


      var firstSub = MenuItems.find(function(i) {
        return i.get('action') === "subcategory"
      });
      var mainMenuIndex = MenuItems.indexOf(firstSub);
      var subCollection = new Utils.categoryCollection(firstSub.models);

      var subMenu = new ListMenu({
        el: '#subMenu',
        collection: subCollection,
        template: MainMenuTemplate,
        direction: 'vertical',
      });

      subMenu.render();



      var videoCollection = Utils.createCollection()


      
      var VideoGrid = GridMenu.extend({
        options: {
          rows: 3,
          cols: 4
        },
        initialize: function() {
          GridMenu.prototype.initialize.call(this);
          this.listenTo(this.collection, 'reset', this.render);
        }
      });

      var Grid = new VideoGrid({
        el: "#gridMenuContainer",
        collection: videoCollection
      })
      Grid.render();


      var mainMenuIndex = 0;
      mainMenu.on('newfocus', function(index) {
        mainMenuIndex = index;
        if(MenuItems.at(index).get('action') === "subcategory") {
           subCollection.reset(MenuItems.at(index).get('subcategory').models);
        }
      })

      subMenu.on('newfocus', function(index) {
        videoCollection.reset(MenuItems.at(mainMenuIndex).get('subcategory').at(index).get('subsubcategory').models)
      });

      mainMenu.render();
      mainMenu.focus();



      //direction etc.
      mainMenu.on('onright', function() {
        this.setSelected();
        subMenu.focus();
        subMenu.trigger('newfocus', subMenu._currentIndex)
      })

      subMenu.on('onleft', function() {
        mainMenu.unsetSelected();
        mainMenu.focus();
      })

      subMenu.on('onright', function() {
        Grid.focus();
      })

      Grid.on('leftedge', function() {
        subMenu.focus();
      })

      Grid.on('newfocus', function(item) {
        updateHTMLforGrid(item);
      })

      var updateHTMLforGrid = function(item) {
        $('.title').html('Title: ' + item.item.get("title"))
      }


    }

    return scene;
  });