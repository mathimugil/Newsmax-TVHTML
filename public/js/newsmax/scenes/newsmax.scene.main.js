define([
        'stagemanager', 'navigation', 'backbone',
        'hbs!newsmax/templates/Sample',
        'newsmax/menus/newsmax.menu.mainmenu',
        'hbs!newsmax/templates/MainMenu',
        'enginelite/menuprototypes/enginelite.menus.gridmenu',
        'enginelite/menuprototypes/enginelite.menus.slotmenu',
        'newsmax/newsmax.mainmenu', 'newsmax/newsmax.utils',
        'newsmax/menus/newsmax.menu.simplekeys',
        'newsmax/newsmax.api',
        'hbs!newsmax/templates/GridMenu',
        'mediaplayer'
    ],
    function(
      StageManager, 
      Navigation, 
      BackBone, 
      sampleTemplate, 
      MainMenu, 
      MainMenuTemplate, 
      GridMenu, 
      SlotMenu, 
      MenuItemsDeferred, 
      Utils, 
      KeyboardMenu, 
      API, 
      GridMenuTemplate, 
      MediaPlayer
    ) {

        'use strict';

        $log(API);

        var scene = new StageManager.Scene({
            defaultScene: true, // Make this our default scene
            name: "main",
            target: "#wrapper",
            view: "views/newsmax.main.html"
        });

        // var landingState = scene.createStaste('landing', true);
        // var subcatState = scene.createState('subcat');
        // var searchState = scene.createState('search');

        var Grid, gridRowHeight;

        scene.onenterscene = function() {

            return MenuItemsDeferred.done(function(MenuItems) {
              $log("menuitems", MenuItems)
                
                
              /* LIVE STREAM CONTROLS */
                var initLiveStream = function(){
                  var liveObj = MenuItems.find(function(i) {
                    return i.get('action') === "livefeed";
                  });
                  var playlist = new MediaPlayer.Playlist();
                  playlist.addVideo(liveObj.get('url'));
                  MediaPlayer.setPlaylist(playlist);
                  
                  MediaPlayer.once('timeupdate',function(){
                      $("#loadingVideoIndicator").fadeOut();
                      $("img#logo").fadeIn();
                      //touchTimeout();
                  },this);
                                    // 
                  $("#loadingVideoIndicator").fadeOut();
                  $("img#logo").fadeIn();
                  MediaPlayer.play();
                } 
                initLiveStream();
                
              /* MENUS */
                var mainMenu = new SlotMenu({
                    el: '#mainMenu',
                    collection: MenuItems,
                    template: MainMenuTemplate,
                    direction: 'vertical',
                });

                var keyMenu = new KeyboardMenu({
                    el: "#keyboard"
                })
                keyMenu.render();

                var firstSub = MenuItems.find(function(i) {
                    return i.get('action') === "subcategory"
                });
                var mainMenuIndex = MenuItems.indexOf(firstSub);
                var subCollection = new Utils.categoryCollection(firstSub.models);

                var subMenu = new SlotMenu({
                    el: '#subMenu',
                    collection: subCollection,
                    template: MainMenuTemplate,
                    direction: 'vertical',
                });
                subMenu.render();
                
                var videoCollection = Utils.createCollection()
                var VideoGrid = GridMenu.extend({
                    options: {
                        rows: 2,
                        cols: 3
                    },
                    initialize: function() {
                        GridMenu.prototype.initialize.call(this);
                        this.listenTo(this.collection, 'reset', this.render);
                        this.on('pageup', this.pageUp, this); 
                        this.on('pagedown', this.pageDown, this); 
                        //this.on('onright', this.onRight, this);
                    },
                    resetIndex: function() {
                      this._currentIndex = 0;
                    },
                    display: function() {
                      $("#gridHTML").fadeIn();
                      $(this.el).fadeIn();
                    },
                    hide: function() {
                      $("#gridHTML").fadeOut();
                      $(this.el).fadeOut();
                    },
                    // onRight: function(){
//                       // this handler simply monitors the detail menu arrow
//                       $log("current index", Grid.currentIndex)
//                     }
                    // pageDown: function(){
//                       $log("page down: ");
//                       moveGrid("down");
//                     },
//                     pageUp: function(){
//                       $log("page up");
//                       moveGrid("up");
//                     }
                });

                Grid = new VideoGrid({
                    el: "#gridMenuContainer",
                    collection: videoCollection,
                    template: GridMenuTemplate
                })
                //Grid.render();
                

                mainMenu.on('selectedindex', function(index) {
                    mainMenuIndex = index;
                    var item = MenuItems.at(index);
                    switch (item.get('action')) {
                        case 'subcategory':
                            subCollection.reset(item.get('subcategory').models);
                            subMenu.focus();
                            break;
                        case 'search':
                            keyMenu.focus();
                            break;

                    }
                })

                var hideMainMenu = function() {
                    $("#mainMenu").animate({
                        left: -$("#mainMenu").outerWidth() + 50,
                        opacity: 0.3
                    })
                }
                var showMainMenu = function() {
                    $("#mainMenu").animate({
                        left: 0,
                        opacity: 1
                    })
                }

                keyMenu.on('onfocus', function() {
                    $("#searchMenu").animate({
                        left: 300,
                        opacity: 1
                    });
                    //hideMainMenu();
                    $log(" ON FOCUS TO KEY MENU ")
                    $("#searchterm").focus();
                }, scene)
                
                keyMenu.on('onblur', function() {
                    $("#searchMenu").animate({
                        left: -$("#searchMenu").outerWidth(),
                        opacity: 0.3
                    });
                    showMainMenu();
                }, scene)

                subMenu.on('onfocus', function() {
                    $("#subMenu").animate({
                        left: 50,
                        opacity: 1
                    });
                    hideMainMenu();
                    $log("triggering");
                    $("#subMenu li.sm-focused").trigger("select");
                }, scene)

                subMenu.on('selecteditem', function(item) {
                    $log('selectedItem = ', subMenu);
                    updateGrid(item.get('url'));
                    Grid.display();
                }, scene);

                mainMenu.render();

                //direction etc.
                mainMenu.on('onright', function() {
                    subMenu.focus();
                }, scene)

                subMenu.on('onleft', function() {
                    showMainMenu();
                    mainMenu.focus();
                    $("#subMenu").animate({
                        left: -$("#subMenu").outerWidth(),
                        opacity: 0.3
                    });
                }, scene)

                subMenu.on('onright', function() {
                  $log("right from submenu");
                  if( $.trim( $('#gridMenuContainer').html() ).length ) {
                    Grid.focus();
                  }
                }, scene)

                keyMenu.on('leftfrommenu', function() {
                    $log("KEY MENU LEFT FROM MENU ")
                    mainMenu.focus();
                }, scene)

                keyMenu.on('valueselect', function(item) {
                    var currentval = $("#searchterm").val();
                    $log(" VALUE SELECT", item, item.length);
                    if (item.length == 1) $("#searchterm").val(currentval + item);
                    else if (item.toLowerCase() === "del") $("#searchterm").val(currentval.substring(0, currentval.length - 1));
                    else if (item.toLowerCase() === "space") $("#searchterm").val(currentval + " ");
                })

                keyMenu.on('rightfrommenu', function() {
                    VideoGrid.focus();
                }, scene)

                Grid.on('leftedge', function() {
                    subMenu.focus();
                }, scene)

                Grid.on('newfocus', function(item) {
                  console.log("new focus");
                  updateHTMLforGrid(item);
                }, scene);

                Grid.on('selecteditem', function(item) {
                    $log('item = ', item);
                    //debugger;
                    StageManager.changeScene('videoPlayback', {
                        item: item
                    });
                });
                
                var positionArrow = function() {
                  $("#gridArrow").removeClass();
                  
                  switch (Grid._currentIndex % Grid.options.cols) {
                    case 0:
                      $("#gridArrow").addClass("left");
                      break;
                    case 1:
                      $("#gridArrow").addClass("middle");
                      break;
                    case 2:
                      $("#gridArrow").addClass("right");
                      break;
                  }
                }
                // we need to control the info box arrow position as we move left and right
                Grid.on('onright', positionArrow);
                Grid.on('onleft', positionArrow);
                
                
                var moveGrid = function (direction) {
                  $(Grid.el).children().removeClass("currentRow");
                  $(Grid.el).children().children().eq(Grid._currentIndex).parent().addClass("currentRow");
                  
                  var move;
                  direction == "up" ? move = "-=" + gridRowHeight : move = "+=" + gridRowHeight;
                  $(Grid.el).animate({
                    top: move
                  }, 0, function(){
                    //animation completed
                  });
                };
                
                var updateHTMLforGrid = function(item) {
                    $('.title').html('Title: ' + item.get("title"))
                    $('.description').html('Description: ' + item.get('description'));
                };

                mainMenu.focus();

            })

            
        }

        var updateGrid = function(url){
            API.fetchMRSS(url).done(function(data){
                Grid.resetIndex();
                Grid.collection.reset(data);
                gridRowHeight = $("ul.gridMenuPage:first").outerHeight();
                Grid.focus();
            })
        }

        return scene;
    });