define(['navigation', 'underscore'], function(Navigation, _) {
/*

  Basic Slot Menu a slot menu has a number of visisble slots which
  are navigable once you hit the last visible slot the list moves

  Note you can do a simple version with a single visible slot which
  would be a fixed focus list menu.

  When extending there are 3 events you want to bind to.

  indexup, indexdown these events get triggered when the _currentIndex
  value gets incremnted or decremented.

  slotup, slotdown these events get triggered when the current slot index
  gets changed.

  masterupp, masterdown these functions are triggered when you are at first
  or last visible slot.

  This means that going right/up will
  fire indexup and slotup (not at slot boundry) OR indexup and masterup (at slot
  boundry.

  you want to create this with the number of visible slots and the
  direction (horizontal or vertical) - direction just switches which
  listers we use up/down or right/left

  There is a generic render function which will call a function with
  the raw collection model data.

 */
  var SlotMenu = Navigation.Menu.extend({

    defaults: {
      visible: 3,
      direction: 'horizontal',
      template: null
    },
    _currentIndex: 0,
    _slotIndex: 0,
    _selectedIndex: 0,

    events : {
      "click .button" : "onSelect",
      "mouseover .button" : "setFocus"
    },

    initialize: function() {
      Navigation.Menu.prototype.initialize.apply(this, arguments);
      this.options = _.defaults(this.options, this.defaults);

      if (this.options.direction === "horizontal") {
        this.on('onright', this._incrementIndex, this);
        this.on('onleft', this._decrementIndex, this);
      } else {
        this.on('ondown', this._incrementIndex, this);
        this.on('onup', this._decrementIndex, this);
      }

      this.on('onselect', this.onSelect, this);

      var _t = this;

      this.listenTo(this.collection, 'reset add remove', function () {
        _t._slotIndex = 0;
        _t._currentIndex = 0;
        _t._selectedIndex = 0;
        _t.render();
        _t._maxIndex = _t.collection.length - 1;
      });
      this.on('onfocus newfocus', this.setFocus, this);
      
    },

    setFocus: function (event){
 
        if(_.isObject(event)) {
          var diff = this._currentIndex - $(event.currentTarget).index();
          this._slotIndex = this._slotIndex - diff;

          this.focus();
          this._currentIndex = $(event.currentTarget).index();
        }
        idx = _.isNumber(event) ? event : this._currentIndex;
        $(this.el).children().removeClass('sm-focused');
        $(this.el).children().eq(this._currentIndex).addClass('sm-focused');
        
    },

    onSelect: function() {

        $log(" SLOT MENU ON SELECT ")
        this.trigger('selectedindex', this._currentIndex);
        this.trigger('selecteditem', this.collection.at(this._currentIndex));
        this._selectedIndex = this._currentIndex;
        
        $(this.el).children().removeClass('selected');
        $(this.el).children().eq(this._currentIndex).addClass('selected');

    },

    _incrementIndex: function() {
      if(this._currentIndex < this._maxIndex) {
        this._currentIndex++;
        this.trigger('newfocus', this._currentIndex);
        if(this._slotIndex < this.options.visible  - 1) {
          this._slotIndex++;
          this.trigger('slotup', this._slotIndex);
        } else  {
           this.trigger('masterup');
           if (this._currentIndex === this._maxIndex) this.trigger('menubottom');
        }
      }
    },

    _decrementIndex: function() {

      if(this._currentIndex > 0 ) {
        this._currentIndex--;
        this.trigger('newfocus', this._currentIndex);
        if(this._slotIndex > 0 ) {
          this._slotIndex--;
          this.trigger('slotdown', this._slotIndex);
        } else {
          this.trigger('masterdown');
          if (this._currentIndex === 0) this.trigger('menutop');
        }
      }
    },
    render: function() {
        if(_.isFunction(this.options.template) && this.collection && this.collection.length) {
            var items = this.collection.map(function(m) { return m.attributes } );
            $(this.el).html(this.options.template({
                items: items
            }));
        }
        $log(" SLOT MENU RENDER AND BIND ")
        /*$(this.el).children().on('mouseover', function() {
            $log(" MOUSEOVER ITEM ", $(this).index());
        })*/
        this._maxIndex = $(this.el).children().length - 1;
        this.trigger("rendered");
        
        //we may have to show some scrolling arrows
        if ($(this.el).children().size() > this.options.visible){ 
            $log(" SLOT MENU NEEDS SCROLLERS FOR THIS COLLECTION ");
            this.trigger("showscrollers"); 
        }
        
        return this;
    }
  });

  return SlotMenu;
})
