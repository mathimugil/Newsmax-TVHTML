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
        'hbs!newsmax/templates/GridMenu'
    ],
    function(StageManager, Navigation, BackBone, sampleTemplate, MainMenu, MainMenuTemplate, GridMenu, SlotMenu, MenuItemsDeferred, Utils, KeyboardMenu, API, GridMenuTemplate) {

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

        var Grid;

        scene.onenterscene = function() {



            return MenuItemsDeferred.done(function(MenuItems) {

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
                        rows: 20,
                        cols: 5
                    },
                    initialize: function() {
                        GridMenu.prototype.initialize.call(this);
                        this.listenTo(this.collection, 'reset', this.render);
                    }
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
                        left: 50,
                        opacity: 1
                    });
                    hideMainMenu();
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
                }, scene)

                subMenu.on('onblur', function() {
                    $("#subMenu").animate({
                        left: -$("#subMenu").outerWidth(),
                        opacity: 0.3
                    });
                    showMainMenu();
                }, scene);

                subMenu.on('selecteditem', function(item) {
                    $log('selectedItem = ', subMenu);
                    updateGrid(item.get('url'));

                    //videoCollection.reset(MenuItems.at(mainMenuIndex).get('subcategory').at(index).get('subsubcategory').models)
                }, scene);

                mainMenu.render();

                //direction etc.
                mainMenu.on('onright', function() {
                    subMenu.focus();
                }, scene)

                subMenu.on('onleft', function() {
                    mainMenu.focus();
                }, scene)

                subMenu.on('onright', function() {
                    Grid.focus();
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
                    //$log('item = ', item);
                    //we should be getting an item here and changing to another scene. but lets just hold off on that for a few moments
                    debugger;
                    StageManager.changeScene('videoPlayback', {
                        item: item
                    });
                })

                var updateHTMLforGrid = function(item) {
                    $('.title').html('Title: ' + item.get("title"))
                    $('.description').html('Description: ' + item.get('description'));
                }

                mainMenu.focus();

            })

            
        }

        var updateGrid = function(url){
            API.fetchMRSS(url).done(function(data){
                Grid.collection.reset(data);
            })
        }

        return scene;
    });