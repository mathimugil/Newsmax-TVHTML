define([
        'stagemanager', 'navigation', 'backbone', 'hbs!newsmax/templates/Sample', 'newsmax/menus/newsmax.menu.mainmenu', 'hbs!newsmax/templates/MainMenu', 'enginelite/menuprototypes/enginelite.menus.gridmenu', 'enginelite/menuprototypes/enginelite.menus.slotmenu', 'newsmax/newsmax.mainmenu', 'newsmax/newsmax.utils'
    ],
    function(StageManager, Navigation, BackBone, sampleTemplate, MainMenu, MainMenuTemplate, GridMenu, SlotMenu, MenuItems, Utils) {

        'use strict';

        var scene = new StageManager.Scene({
            defaultScene: true, // Make this our default scene
            name: "main",
            target: "#wrapper",
            view: "views/newsmax.main.html"
        });

        scene.onenterscene = function() {

            var mainMenu = new SlotMenu({
                el: '#mainMenu', collection: MenuItems,
                template: MainMenuTemplate, direction: 'vertical',
            });


            var firstSub = MenuItems.find(function(i) {
                return i.get('action') === "subcategory"
            });
            var mainMenuIndex = MenuItems.indexOf(firstSub);
            var subCollection = new Utils.categoryCollection(firstSub.models);

            var subMenu = new SlotMenu({
                el: '#subMenu', collection: subCollection,
                template: MainMenuTemplate, direction: 'vertical',
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
            mainMenu.on('selectedindex', function(index) {

                mainMenuIndex = index;
                var item = MenuItems.at(index);
                if (item.get('action') === "subcategory") {
                    subCollection.reset(item.get('subcategory').models);
                    subMenu.focus();
                }
            })
            subMenu.on('onfocus', function() {
                $("#subMenu").animate({
                    left: 50, opacity: 1
                });
                $("#mainMenu").animate({
                    left: -$("#subMenu").outerWidth() + 50, opacity: 0.3
                })
            }, scene)
            subMenu.on('onblur', function() {
                $("#subMenu").animate({
                    left: -$("#subMenu").outerWidth(), opacity: 0.3
                });
                $("#mainMenu").animate({
                    left: 0, opacity: 1
                })
            }, scene)
            subMenu.on('newfocus', function(index) {
                videoCollection.reset(MenuItems.at(mainMenuIndex).get('subcategory').at(index).get('subsubcategory').models)
            });

            mainMenu.render();
            mainMenu.focus();



            //direction etc.
            mainMenu.on('onright', function() {
                subMenu.focus();
            })

            subMenu.on('onleft', function() {
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