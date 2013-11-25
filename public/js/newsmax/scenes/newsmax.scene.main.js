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
                  $("#loadingVideoIndicator").fadeOut();
                  $("img#logo").fadeIn();
                  //MediaPlayer.play();
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
                    direction: 'vertical'
                });
                subMenu.render();
                
                var videoCollection = Utils.createCollection()
                var VideoGrid = GridMenu.extend({
                    options: {
                        rows: 1,
                        cols: 4
                    },
                    initialize: function() {
                        GridMenu.prototype.initialize.call(this);
                        this.listenTo(this.collection, 'reset', this.render);
                        this.on('pageup', this.pageUp, this); 
                        this.on('pagedown', this.pageDown, this); 
                    },
                    resetIndex: function() {
                      /* we have to do a little fanciness. If there are less than two full rows of 
                       * items, we have to set the index differently
                       */
                      $log("number elements in collection: ", this.collection.models.length);
                      if (this.collection.models.length >= (this.options.cols * this.options.rows * 2) ){
                        this._currentIndex = this.options.cols; //we want the first item in the 2nd row
                      }else{
                        //we have to apply an offset
                        $(this.el).addClass("offset");
                        this._currentIndex = 0;
                      }
                      
                    },
                    show: function() {
                      $("#gridHTML").fadeIn();
                      $("#gridMenuHolder").fadeIn();
                    },
                    hide: function() {
                      $("#gridHTML").fadeOut();
                      $("#gridMenuHolder").fadeOut();
                    },
                    pageDown: function(){
                      $log("page down: ");
                      moveGrid("down");
                    },
                    pageUp: function(){
                      $log("page up");
                      moveGrid("up");
                    },
                    // OVERRIDE DEFAULT FUNCTIONS
                    _columnUp: function() { // move right
                      if((this._currentIndex % this.options.cols) == (this.options.cols -1)) {
                        // don't do anything on the far right
                      } else if (this._currentIndex < this.collection.length - 1) {
                        this._currentIndex++;
                        this.setFocus();
                      }
                    },
                    _columnDown: function() { // move left
                      if((this._currentIndex % this.options.cols) !== 0 ) {
                        this._currentIndex--;
                        this.setFocus();
                      } else {
                        subMenu.focus();
                      }
                    },
                    _rowUp: function() {
                      if ( (this._currentIndex > 0) && (this._currentIndex > (this.options.cols - 1)) ){
                        this._currentIndex -= this.options.cols;
                        this.setFocus();
                        this.trigger("pagedown");
                      } else {
                        //not sure if we'll need this or not
                        this.trigger("upfromtop")
                      }
                    },

                    _rowDown: function() {
                      
                      var coords = this.coords();
                      if( this._currentIndex < (this.collection.length - 1) ) {
                        //we need to consider the last line carefully
                        if (coords.pageIndex = coords.maxPageIndex - 1){
                          if ((this._currentIndex + this.options.cols) > (this.collection.length - 1) ){
                            this._currentIndex = this.collection.length - 1;
                          }else{
                            this._currentIndex += this.options.cols;
                          }
                        }else{
                          this._currentIndex += this.options.cols;
                        }
                        
                        this.setFocus();
                        this.trigger("pageup");
                       } else {
                        //not sure if we'll need this
                        this.trigger("downfrombottom");
                       }
                    },
                    
                });

                Grid = new VideoGrid({
                    el: "#gridMenuContainer",
                    collection: videoCollection,
                    template: GridMenuTemplate
                })

                mainMenu.on('selectedindex', function(index) {
                    mainMenuIndex = index;
                    var item = MenuItems.at(index);
                    $log("action is: ", item.get('action') );
                    $log("item is: ", item );
                    switch (item.get('action')) {
                        case 'subcategory':
                            subCollection.reset(item.get('subcategory').models);
                            updateGrid(item.get('subcategory').at(0).get('url'));
                            subMenu.focus();
                            $("#subMenu li.sm-focused").addClass("selected").removeClass("sm-focused");
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
                  $log("subMenu on focus, ", this)
                    $("#subMenu").animate({
                        left: 50,
                        opacity: 1
                    });
                    hideMainMenu();
                }, scene);
                
                subMenu.on('selecteditem', function(item) {
                  $("#subMenu li").removeClass("selected");
                  $("#subMenu li.sm-focused").addClass("selected").removeClass("sm-focused");
                  updateGrid(item.get('url'));  
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
                  $("#subMenu li").removeClass("sm-focused");
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
                  updateHTMLforGrid(item);
                }, scene);

                Grid.on('selecteditem', function(item) {
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
                      $("#gridArrow").addClass("middle-left");
                      break;
                    case 2:
                      $("#gridArrow").addClass("middle-right");
                      break;
                    case 3:
                      $("#gridArrow").addClass("right");
                      break;
                  }
                }
                // we need to control the info box arrow position as we move left and right
                Grid.on('onright', positionArrow);
                Grid.on('onleft', positionArrow);
                
                var moveGrid = function (direction) {
                  updateSelectorsForGrid();
                  var options = {};
                  direction == "up" ? options = {"top": "-=" + gridRowHeight + "px"} : options = { "top": "+=" + gridRowHeight + "px"};
                  $("#gridMenuContainer").animate(options, 0, function(){
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
        var updateSelectorsForGrid = function() {
          $(Grid.el).children().removeClass("currentRow");
          $(Grid.el).children().children().eq(Grid._currentIndex).parent().addClass("currentRow");
        }
        
        var updateGrid = function(url){
          showLoader();
            API.fetchMRSS(url).done(function(data){
                hideLoader();
                Grid.show();
                Grid.collection.reset(data);
                Grid.resetIndex();
                gridRowHeight = $("ul.gridMenuPage:first").outerHeight();
                updateSelectorsForGrid();
                Grid.focus();
            })
        }
        
        var showLoader = function(){
          $("#circularG").fadeIn();
        }
        
        var hideLoader = function(){
          $("#circularG").fadeOut();
        }

        return scene;
    });