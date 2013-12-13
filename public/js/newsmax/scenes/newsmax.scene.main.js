define([
        'stagemanager', 'navigation', 'backbone',
        'hbs!newsmax/templates/Sample',
        'newsmax/menus/newsmax.menu.mainmenu',
        'hbs!newsmax/templates/MainMenu',
        'enginelite/menuprototypes/enginelite.menus.gridmenu',
        'enginelite/menuprototypes/enginelite.menus.slotmenu',
        'newsmax/newsmax.mainmenu',
        'newsmax/newsmax.utils',
        'newsmax/menus/newsmax.menu.simplekeys',
        'newsmax/menus/newsmax.menu.modalmenu',
        'newsmax/newsmax.api',
        'hbs!newsmax/templates/GridMenu',
        'mediaplayer',
        'utils',
        'config',
        'platform'
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
        ModalMenu,
        API,
        GridMenuTemplate,
        MediaPlayer,
        Util,
        conf,
        Platform
    ) {

        //'use strict';

        //$log(API);

        var scene = new StageManager.Scene({
            defaultScene: true, // Make this our default scene
            name: "main",
            target: "#wrapper",
            view: "views/newsmax.main.html"
        });

        var cancelFetch = false; //used to cancel fetches when used with back button
        var searchState = false; //if true in search state, if false, in non-search state ie. other grids
        scene.disableBack = false;

        scene.handlesback = function() {

            if(this.disableBack) return;

            setCancelFetch(true);

            if (!wrapperVisible) { //if wrapper is hidden
                //mainMenu.trigger('onright');
                return false;
            }

            if (searchState) { //if we are actually on search grid w/ results
                mainMenu.trigger("selectedindex", mainMenu._maxIndex); 
                searchState = false;
                return false;
            }

            if (mainMenu.focused && hideSubNav) { //top of the hour news no submenu
                hideGrid();
                return false;
            }

            if (mainMenu.focused)
                return true;

            if (subMenu.focused) {
                subMenu.trigger('onleft');
                return false;
            }

            if (keyMenu.focused) {
                mainMenu.focus();
                return false;
            }

            if (Grid.focused) {
                subMenu.trigger('onleft');
                return false;
            }

            return true;
        }

        // var hiddenMenus = scene.createState('hiddenMenus', false);
        // var visibleMenus = scene.createState('visibleMenus', true);
        var mainState = scene.createState('mainState', true);

        var Grid, mainMenu, subMenu, keyMenu, gridRowHeight, lastFocusIndex, lastGridCollection, lastSubmenuIndex, lastSubmenuCollection, lastMainmenuIndex, gridShowing, subCollection;

        var dummyMenu = new Navigation.Menu();
        var hideSubNav = false; //we use this in the case where there is no grid - i.e. Top of the Hour News
        var wrapperVisible;
        var fetchCounter = 0;

        scene.onenterscene = function() {
            $log(">>> ENTERING MAIN SCENE!!");
            showWrapper();
            return MenuItemsDeferred.done(function(MenuItems) {
                $log("menuitems", MenuItems);
                conf.pauseScreenhider = false;

                /* LIVE STREAM CONTROLS */
                var initLiveStream = function() {

                    var liveObj = MenuItems.find(function(i) {
                        return i.get('action') === "livefeed";
                    });
                    var playlist = new MediaPlayer.Playlist();
                    playlist.addVideo(liveObj.get('url'));
                    MediaPlayer.setPlaylist(playlist);

                    MediaPlayer.once('timeupdate', function() {
                        $("#loadingVideoIndicator").fadeOut();
                        $("img#logo").fadeIn();
                        //touchTimeout();
                    }, this);

                    MediaPlayer.play();
                    $("#loadingVideoIndicator").fadeOut();
                    $("img#logo").fadeIn();
                }
                initLiveStream();

                /* MENUS */
                if (!mainMenu) {
                    mainMenu = new SlotMenu({
                        el: '#mainMenu',
                        collection: MenuItems,
                        template: MainMenuTemplate,
                        direction: 'vertical',
                    });

                    mainMenu.on('rendered', function() {
                        $("#mainMenu li:first").addClass("selected");
                    });

                    mainMenu.render();
                }

                if (!keyMenu) {
                    keyMenu = new KeyboardMenu({
                        el: "#keyboard"
                    })
                    keyMenu.render();
                }

                var firstSub = MenuItems.find(function(i) {
                    return i.get('action') === "subcategory"
                });
                var mainMenuIndex = MenuItems.indexOf(firstSub);
                
                subCollection = new Utils.categoryCollection(firstSub.models);

                if (!subMenu) {
                    subMenu = new SlotMenu({
                        el: '#subMenu',
                        collection: subCollection,
                        template: MainMenuTemplate,
                        direction: 'vertical',
                        visible: 9
                    });
                    subMenu.render();

                    $('#subMenuBackTarget').on('click',function(){
                        subMenu.trigger('onleft');
                    });
                    $('#subMenuUpTarget').on('click',function(){
                        subMenu.trigger('onup');
                    });
                    $("#subMenuDownTarget").on('click',function(){
                        subMenu.trigger('ondown');
                    })
                }

                if(Platform.name === 'lg'){
                    $("#errorField").append($('<div>settingup mouseon handler in main scene</div>'))
                    window.onmouseon = function() {
                        $("#errorField").append($('<div>mouseon detected in the main scene</div>'))
                        $('#subMenuBackTarget').show();
                    };
                    window.onmouseoff = function() {
                        $('#subMenuBackTarget').hide();
                    };
                } 

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
                        if (this.collection.models.length >= (this.options.cols * this.options.rows * 2)) {
                            this._currentIndex = this.options.cols; //we want the first item in the 2nd row
                        } else {
                            moveGrid("down");
                            this._currentIndex = 0;
                        }

                    },
                    pageDown: function() {
                        moveGrid("down");
                    },
                    pageUp: function() {
                        moveGrid("up");
                    },
                    // OVERRIDE DEFAULT FUNCTIONS
                    _columnUp: function() { // move right
                        if ((this._currentIndex % this.options.cols) == (this.options.cols - 1)) {
                            // don't do anything on the far right
                        } else if (this._currentIndex < this.collection.length - 1) {
                            this._currentIndex++;
                            this.setFocus();
                        }
                    },
                    _columnDown: function() { // move left
                        if ((this._currentIndex % this.options.cols) !== 0) {
                            this._currentIndex--;
                            this.setFocus();
                        } else {
                            hideSubNav ? mainMenu.focus() : subMenu.focus();
                        }
                    },
                    _rowUp: function() {
                        if ((this._currentIndex > 0) && (this._currentIndex > (this.options.cols - 1))) {
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
                        if (this._currentIndex < (this.collection.length - 1) && (coords.pageIndex !== coords.maxPageIndex)) {
                            //we need to consider the last line carefully
                            if (coords.pageIndex == coords.maxPageIndex - 1) {
                                if ((this._currentIndex + this.options.cols) > (this.collection.length - 1)) {
                                    // we can't just move down, we need to go to the end of the collection
                                    this._currentIndex = this.collection.length - 1;
                                    positionArrow();
                                } else {
                                    this._currentIndex += this.options.cols;
                                }
                            } else {
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

                if (!Grid) {
                    Grid = new VideoGrid({
                        el: "#gridMenuContainer",
                        collection: videoCollection,
                        template: GridMenuTemplate
                    });

                    $('#rowUpButton').click(function(){
                        Grid.trigger('onup');
                    });
                    $('#rowDownButton').click(function(){
                        Grid.trigger('ondown');
                    });
                }

                mainMenu.on('selectedindex', function(index) {
                    //make sure search term box is hidden
                    $("#searchTermBox").hide();
                    mainMenuIndex = index;
                    var item = MenuItems.at(index);
                    hideSubNav = false;
                    setCancelFetch(false);
                    // $log("action is: ", item.get('action'));
//                     $log("item is: ", item);

                    switch (item.get('action')) {
                        case 'livefeed':
                            hideWrapper();
                            lastMenuFocus = mainMenu;
                            dummyMenu.focus();
                            if($('#gridMenuHolder').is(':visible')) hideGrid(); //just in case
                            setCancelFetch(true);
                            break;
                        case 'subcategory':
                            hideGrid();
                            subMenu.collection.reset(item.get('subcategory').models);
                            updateGrid(item.get('subcategory').at(0).get('url'));
                            subMenu.focus();
                            $("#subMenu li.sm-focused").addClass("selected");
                            break;
                        case 'videos':
                            hideSubNav = true;
                            //$log("setting hideSubNav to true: ", hideSubNav);
                            hideGrid();
                            updateGrid(item.get("url"));
                            break;
                        case 'search':
                            hideGrid();
                            hideSubNav = true;
                            setCancelFetch(true);
                            keyMenu.focus();
                            break;
                    }
                },scene);

                var hideMainMenu = function() {
                    $("#mainMenuObscure").show();
                    $("#mainMenu").animate({
                        left: -$("#mainMenu").outerWidth() + 50,
                        opacity: 0.3
                    });
                }
                var showMainMenu = function() {
                    $("#mainMenuObscure").hide();
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
                    $("#subMenu li").eq(this._currentIndex).addClass("sm-focused");
                    $("#subMenuHolder").animate({
                        left: 50,
                        opacity: 1
                    });
                    hideMainMenu();
                }, scene);

                subMenu.on('onblur', function(){
                    //$log("subMenu onblur firing");
                    $("#subMenu li").removeClass("sm-focused");
                }, scene);
                
                subMenu.on('selecteditem', function(item) {
                    hideGrid();
                    $("#subMenu li").removeClass("selected");
                    $("#subMenu li.sm-focused").addClass("selected");
                    updateGrid(item.get('url'));
                }, scene);
                
                subMenu.on("showscrollers", function(){
                    // this is triggered by SlotTarget menu on init if there are more elements than 
                    // the visible option passed in
                    $("#subMenuDownTarget").show();
                }, scene)
                
                subMenu.on("masterup", function(){
                    moveSubNab("up");
                    $("#subMenuUpTarget").show();
                }, scene);
                
                subMenu.on("masterdown", function(){
                    $("#subMenuDownTarget").show();
                    moveSubNab("down");
                }, scene);
                
                subMenu.on("menubottom", function(){
                    $("#subMenuDownTarget").hide();
                }, scene);
                
                subMenu.on("menutop", function(){
                    $("#subMenuUpTarget").hide();
                }, scene);

                //direction etc.
                mainMenu.on('onright', function() {
                    if (hideSubNav && $("#gridMenuHolder").is(':visible')){ //top of the hour news matches this case
                        $("#mainMenu li").removeClass("sm-focused");
                        Grid.focus();
                    }else if($("#mainMenu li:last").hasClass("sm-focused")){
                        return;
                    }else{
                        return;
                    } 
                }, scene);
                
                dummyMenu.on('onup ondown onleft onright onreturn onselect',function(){
                    showWrapper();
                    lastMenuFocus.focus();
                },scene);

                mainMenu.on('onblur', function() {
                    $("#mainMenu li").removeClass("sm-focused");
                },scene)

                subMenu.on('onleft', function() {
                    setCancelFetch(true);
                    resetSubNav();
                    showMainMenu();
                    hideGrid();
                    mainMenu.focus();
                    $("#subMenuHolder").animate({
                        left: -$("#subMenuHolder").outerWidth(),
                        opacity: 0.3
                    });
                }, scene)

                subMenu.on('onright', function() {
                    if ($.trim($('#gridMenuContainer').html()).length && $("#gridMenuHolder").is(':visible')) {
                        Grid.focus();
                    }
                }, scene)

                keyMenu.on('leftfrommenu', function() {
                    mainMenu.focus();
                }, scene)

                keyMenu.on('valueselect', function(item) {
                    var currentval = $("#searchterm").val();
                    if (item.length == 1 && $("#searchterm").val().length < 20) {
                        $("#searchterm").val(currentval + item);
                    } else if (item.toLowerCase() === "del") {
                        $("#searchterm").val(currentval.substring(0, currentval.length - 1));
                    } else if (item.toLowerCase() === "space") {
                        $("#searchterm").val(currentval + " ");
                    } else if (item.toLowerCase() === "clear") {
                        $("#searchterm").val("");
                    } else if (item.toLowerCase() === "ok") {
                        runSearch($("#searchterm").val());
                    }
                }, scene)

                keyMenu.on('rightfrommenu', function() {
                    VideoGrid.focus();
                }, scene)

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

                Grid.on('newfocus', function(item) {
                    positionArrow();
                    updateHTMLforGrid(item);
                }, scene);

                Grid.on('selecteditem', function(item) {
                    saveState();
                    StageManager.changeScene('videoPlayback', {
                        item: item
                    });
                }, scene);

                // we need to control the info box arrow position as we move left and right
                //Grid.on('onright', positionArrow, scene);
                //Grid.on('onleft', positionArrow, scene);
                
                // we hide the space and the info box; we also clear the info box
                Grid.on('onblur', function(){
                  $("#gridHTML").hide();
                  $("#gridHTML .title, #gridHTML .trt, #gridHTML .description").empty();
                  clearSelectorsForGrid();
                }, scene);
                
                // we need to show and make space for the info box
                Grid.on('onfocus', function(){
                  //$log("grid is on focus")
                  $(Grid.el).children().children().eq(Grid._currentIndex).parent().addClass("currentRow");
                  $("#gridHTML").show();
                });

                var moveGrid = function(direction) {
                    clearSelectorsForGrid();
                    $(Grid.el).children().children().eq(Grid._currentIndex).parent().addClass("currentRow");
                    var options = {};
                    direction == "up" ? options = {
                        "top": "-=" + gridRowHeight + "px"
                    } : options = {
                        "top": "+=" + gridRowHeight + "px"
                    };
                    $("#gridMenuContainer").animate(options, 0, function() {
                        //animation completed
                    });

                };
                
                var resetGridPosition = function() {
                    $("#gridMenuContainer").css({
                        top: "10px"
                    });
                }
                
                var moveSubNab = function(direction) {
                    var subMenuRowHeight = $("#subMenu li:first").outerHeight(true);
                    var options = {};
                    direction == "up" ? options = {
                        "top": "-=" + subMenuRowHeight + "px"
                    } : options = {
                        "top": "+=" + subMenuRowHeight + "px"
                    };
                    $("#subMenu").animate(options, 0, function() {
                        //animation completed
                    });
                }
                
                var resetSubNav = function() {
                    $("#subMenu").css({
                        top: "0px"
                    });
                    $("#subMenuUpTarget").hide();
                    $("#subMenuDownTarget").hide();
                }
                var updateHTMLforGrid = function(item) {
                    if (item && item.attributes && item.attributes.description) {
                        $('.description').html(item.get('description'));
                        $('.description').ellipsis({
                            row: 4
                        });
                    } else {
                        $('.description').empty();
                    }
                    if(item && item.attributes && item.attributes.duration){ 
                      var duration = parseInt(item.get('duration')) * 1000;
                      $('.trt').text(Util.convertMstoHumanReadable(duration));
                    }else{
                      $log("no duration")
                      $('.trt').empty();
                    }
                    $('.title').html(item.get("title"));
                    $('.title').ellipsis({ row: 1 });
                };
                
                mainMenu.focus();
            })


        }
        scene.tearDownMenus = function() {
            mainMenu.off(null, null, this);
            subMenu.off(null, null, this);
            keyMenu.off(null, null, this);
            Grid.off(null, null, this);
        }

        scene.onleavescene = function() {
            saveState();
            scene.tearDownMenus();
            hideWrapper();
        }


        /* STATE MANAGEMENT */
        mainState.onenterstate = function() {
            // if we're re-entering this scene, reset the state of the grid, as it forgets
            // the only way into video playback is via the grid, so no special handling is required
            if (typeof(lastFocusIndex) != "undefined") {
                Grid.collection.reset(lastGridCollection.models);
                Grid._currentIndex = lastFocusIndex;
                subCollection.reset(lastSubmenuCollection.models);               
                subMenu._currentIndex = lastSubmenuIndex;
                if (gridShowing) showGrid();
                lastMenuFocus.focus();
            }
        }
        mainState.onleavestate = function() {
            $log("%%%%%%%%%%%% leaving main state");
        }

        /* UTILITY FUNCTIONS */
        var clearSelectorsForGrid = function() {
            $(Grid.el).children().removeClass("currentRow");
        }

        var runSearch = function(term) {
            term = $.trim(term);
            if (term === "") return;
            searchState = true;
            setCancelFetch(false);
            showLoader();
            mainMenu.focus();
            API.doSearch(term).then(function(data) {
                conf.pauseScreenhider = false;
                $globalScreenHider.touchHideTimeout();
                if (cancelFetch) {
                    setCancelFetch(false);
                    return;
                }

                if (data.length > 0) {
                    $("#searchTermBox span.label").empty().html("Search Results for: ")
                    $("#searchTermBox span.term").empty().html(term);
                    populateGrid(data);
                    Grid.resetIndex();
                    Grid.focus();
                } else { // no search results
                    $("#searchTermBox span.label").empty().html('0 Search Results for: "' + term + '"');
                    $("#searchTermBox span.term").empty();
                    emptyGrid();
                    hideLoader();
                    $("#gridMenuHolder").fadeIn();
                    $("#gridMenuContainer").fadeIn();
                }
                $("#searchTermBox").show();
                searchState = true;

            });
        }

        var updateGrid = function(url) {
            showLoader();

            fetchCounter++;
            API.fetchMRSS(url).done(function(data) {

                fetchCounter--;
                if (cancelFetch) {
                    setCancelFetch(false);
                    return;
                }

                searchState = false;
                populateGrid(data);
            });
        }

        var populateGrid = function(data) {
            hideLoader();
            showGrid();
            Grid.collection.reset(data);
            Grid.resetIndex();
            gridRowHeight = $("ul.gridMenuPage:first").outerHeight();
            clearSelectorsForGrid();
            conf.pauseScreenhider = false;
            $globalScreenHider.touchHideTimeout();
        }

        var showWrapper = function() {
            wrapperVisible = true;
            $("#wrapper").fadeIn();
        }

        var hideWrapper = function() {
            wrapperVisible = false;
            $("#wrapper").fadeOut();
        }
        
        var hideGrid = function() {
            gridShowing = false;
            $("#gridMenuHolder").hide();
            $("#gridHTML").fadeOut();
        }

        var showGrid = function() {
            gridShowing = true;
            $("#gridMenuHolder").show();
            $("#gridMenuContainer").fadeIn();
        }

        var emptyGrid = function() {
            $("#gridMenuContainer").empty();
        }

        var showLoader = function() {
            $("#circularG").fadeIn();
        }

        var hideLoader = function() {
            $("#circularG").fadeOut();
        }

        var renderModal = function(header, message) {
            $("#errormodal h1").empty().html(header);
            $("#errormodal span").empty().html(message);
            $("#errormodal").fadeIn();
            modalMenu.focus();
        }

        var saveState = function() {
            lastMenuFocus = Navigation.currentFocus.menu;
            lastMainmenuIndex = mainMenu._currentIndex;
            lastFocusIndex = Grid._currentIndex;
            lastGridCollection = Grid.collection;
            lastSubmenuCollection = subMenu.collection;
            lastSubmenuIndex = subMenu._currentIndex;
        }
        
        var setCancelFetch = function(bool){
            //$log(">>>>>>>> SETTING CANCELFETCH TO", bool);
          
            if(bool){
                hideLoader();
                //$log('cancelFetch F A L S E');
                cancelFetch = true;
                conf.pauseScreenhider = false;                 
            }
            else{
                if(fetchCounter==0){
                    cancelFetch = false;
                    //$log("cancelFetch T R U E ");                    
                }

            }
        }
        return scene;
    });
