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
        });        // 
        // var hiddenMenus = scene.createState('hiddenMenus', false);
        // var visibleMenus = scene.createState('visibleMenus', true);

        var Grid, mainMenu, subMenu, keyMenu, gridRowHeight;
        var hideSubNav = false;
        var wrapperVisible = true;
        //var dummyMenu = new Navigation.Menu(); //we use this for hidden controls state

        scene.onenterscene = function() {
          $("#wrapper").fadeIn();
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
                  
                  MediaPlayer.play();
                }
                initLiveStream();

              /* MENUS */
                mainMenu = new SlotMenu({
                    el: '#mainMenu',
                    collection: MenuItems,
                    template: MainMenuTemplate,
                    direction: 'vertical',
                });

                keyMenu = new KeyboardMenu({
                    el: "#keyboard"
                })
                keyMenu.render();

                var firstSub = MenuItems.find(function(i) {
                    return i.get('action') === "subcategory"
                });
                var mainMenuIndex = MenuItems.indexOf(firstSub);
                var subCollection = new Utils.categoryCollection(firstSub.models);

                subMenu = new SlotMenu({
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
                      resetGridPosition();
                      /* we have to do a little fanciness. If there are less than two full rows of
                       * items, we have to set the index differently
                       */
                      if (this.collection.models.length >= (this.options.cols * this.options.rows * 2) ){
                        this._currentIndex = this.options.cols; //we want the first item in the 2nd row
                      }else{
                        moveGrid("down");
                        this._currentIndex = 0;
                      }

                    },
                    pageDown: function(){
                      moveGrid("down");
                    },
                    pageUp: function(){
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
                        hideSubNav ? mainMenu.focus() : subMenu.focus();
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
                        if (coords.pageIndex == coords.maxPageIndex - 1){
                          if ((this._currentIndex + this.options.cols) > (this.collection.length - 1) ){
                            // we can't just move down, we need to go to the end of the collection
                            this._currentIndex = this.collection.length - 1;
                            positionArrow();
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
                    hideSubNav = false;
                    $log("action is: ", item.get('action') );
                    switch (item.get('action')) {
                        case 'livefeed':
                            //scene.changeState('hiddenMenus');
                            hideWrapper();
                            break;
                        case 'subcategory':
                            subCollection.reset(item.get('subcategory').models);
                            updateGrid(item.get('subcategory').at(0).get('url'));
                            subMenu.focus();
                            $("#subMenu li.sm-focused").addClass("selected").removeClass("sm-focused");
                            break;
                        case 'videos':
                            hideSubNav = true;
                            $log("setting hideSubNav to true: ", hideSubNav);
                            updateGrid(item.get("url"));
                            break;
                        case 'search':
                            keyMenu.focus();
                            break;
                    }
                });
                
                mainMenu.on('rendered', function(){
                  $log("rendered triggered");
                  $("#mainMenu li:first").addClass("selected");
                });

                var hideMainMenu = function() {
                    $("#mainMenu").animate({
                        left: -$("#mainMenu").outerWidth() + 50,
                        opacity: 0.3
                    });
                }
                var showMainMenu = function() {
                    $("#mainMenu").animate({
                        left: 0,
                        opacity: 1
                    })
                }

                keyMenu.on('onfocus', function() {
                    $("#searchMenu").animate({
                        left: 350,
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
                  $log("subMenu on focus, ", this);
                  $("#subMenu li").eq(this._currentIndex).addClass("sm-focused");
                    $("#subMenu").animate({
                        left: 50,
                        opacity: 1
                    });
                    hideMainMenu();
                }, scene);

                subMenu.on('selecteditem', function(item) {
                  $("#subMenu li").removeClass("selected");
                  $("#subMenu li.sm-focused").addClass("selected"); 
                  updateGrid(item.get('url'));
                }, scene);

                mainMenu.render();

                //direction etc.
                mainMenu.on('onright', function() {
                  if (!wrapperVisible){
                    showWrapper();
                  }else{
                    $("#mainMenu li").removeClass("sm-focused");
                    hideSubNav ? Grid.focus() : subMenu.focus();
                  }
                }, scene);
                
                mainMenu.on('onup ondown onleft', function(){
                  if (!wrapperVisible){
                    showWrapper();
                  }
                })

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
                    if (item.length == 1 && $("#searchterm").val().length < 20){
                      $("#searchterm").val(currentval + item);
                    } else if (item.toLowerCase() === "del") {
                      $("#searchterm").val(currentval.substring(0, currentval.length - 1));
                    } else if (item.toLowerCase() === "space"){
                      $("#searchterm").val(currentval + " ");
                    } else if (item.toLowerCase() === "clear"){
                      $("#searchterm").val("");
                    }
                })

                keyMenu.on('rightfrommenu', function() {
                    VideoGrid.focus();
                }, scene)


                Grid.on('newfocus', function(item) {
                  updateHTMLforGrid(item);
                }, scene);

                Grid.on('selecteditem', function(item) {
                  $log(">>>>> item: ", item);
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
                var resetGridPosition = function (){
                  $("#gridMenuContainer").css({top: "10px"});
                }

                var updateHTMLforGrid = function(item) {
                    if(item && item.attributes && item.attributes.description){ 
                      $('.description').html(item.get('description')); 
                      $('.description').ellipsis({ row: 4 });
                    }
                    $('.title').html(item.get("title"));
                };
                mainMenu.focus();
            })

        }
        scene.tearDownMenus = function(){
          $log("tearing down menus on main scene");
          mainMenu.off(null, null, this);
          subMenu.off(null, null, this);
          keyMenu.off(null, null, this);
          Grid.off(null, null, this);
          dummyMenu.off(null, null, this);
        }
        scene.initMenus = function(){
          
        }
        scene.onleavescene = function() {
          $log(">>> LEAVING SCENE!!");
          scene.tearDownMenus();
          
        }
        
        
        /* SCENE MANAGEMENT */
        // visibleMenus.onenterstate = function() {
 //          $log('>>>> visibleMenus state');
 //          scene.initMenus();
 //          mainMenu.focus();
 //        }
 //        
 //        hiddenMenus.onenterstate = function() {
 //          $('#wrapper').fadeOut();
 //          $log('>>>> hiddenMenus state');
 // 
 //          dummyMenu.on('onright onleft onup ondown onselect',function(e,l){
 //            scene.changeState('visibleMenus');
 //            //Navigation.back();
 //          }, this);
 // 
 //          dummyMenu.focus();     
 //        }
 //        
 //        hiddenMenus.onleavestate = function() {
 //          $log('>>>> leaving hiddenMenus state');
 //          dummyMenu.off(null,null,this);
 //          $('#wrapper').fadeIn();
 //        }
        
        /* UTILITY LAYOUT FUNCTIONS */
        var updateSelectorsForGrid = function() {
          $(Grid.el).children().removeClass("currentRow");
          $(Grid.el).children().children().eq(Grid._currentIndex).parent().addClass("currentRow");
        }

        var updateGrid = function(url){
          showLoader();
            API.fetchMRSS(url).done(function(data){
                hideLoader();
                showGrid();
                Grid.collection.reset(data);
                Grid.resetIndex();
                gridRowHeight = $("ul.gridMenuPage:first").outerHeight();
                updateSelectorsForGrid();
            })
        }
        
        var showWrapper = function(){
          $log("SHOWING WRAPPER!");
          wrapperVisible = true;
          $("#wrapper").fadeIn();
        }
        
        var hideWrapper = function(){
          $log("HIDING WRAPPER!")
          wrapperVisible = false;
          $("#wrapper").fadeOut();
        }
        
        var hideGrid = function(){
          $log(">>> HIDING GRID")
          $("#gridMenuHolder").fadeOut();
          $("#gridHTML").fadeOut();
        }
        
        var showGrid = function(){
          $log(">> SHOWING GRID")
          $("#gridMenuHolder").fadeIn();
          $("#gridMenuContainer").fadeIn();
          $("#gridHTML").fadeIn();
        }

        var showLoader = function(){
          $("#circularG").fadeIn();
        }

        var hideLoader = function(){
          $("#circularG").fadeOut();
        }

        return scene;
    });
