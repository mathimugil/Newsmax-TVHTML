define(['navigation', 'underscore'], function(Navigation, _) {
  /*

  Basic Slot Menu a slot menu has a number of visisble slots which
  are navigable once you hit the last visible slot the list moves

  Note you can do a simple version with a single visible slot which
  would be a fixed focus list menu.

  When extending there are 3 functions you want to override.

  indexUp, indexDown these functions get called when the _currentIndex
  value gets incremnted or decremented.

  slotUp, slotDown these functions get called when the current slot index
  gets changed.

  masterUp, masterDown these functions are called when you are at first
  or last visible slot.

  This means that going right/up (unless you're at a boundry) will
  call indexUp and slotUp OR indexUp and masterUp.

  you want to create this with the number of visible slots and the
  direction (horizontal or vertical) - direction just switches which
  listers we use up/down or right/left

 */
  var ListMenu = Navigation.Menu.extend({

    _currentIndex: 0,

    defaults: {
      direction: 'horizontal'
    },

    initialize: function() {
      $log(" IST MENU ARGS", arguments, this.options);
      Navigation.Menu.prototype.initialize.call(this, arguments);
      this.options = _.defaults(this.options, this.defaults);

      var _t = this;

      if (this.options.direction === "horizontal") {
        this.on('onright', this._incrementIndex, this);
        this.on('onleft', this._decrementIndex, this);
      } else {
        this.on('ondown', this._incrementIndex, this);
        this.on('onup', this._decrementIndex, this);
      }

      this.on('onfocus', function() {
        $log(" LIST MENU ON FOCUS ", this.$el);
        this.max = (_t.$el.length && _t.$el.children().length) ? _t.$el.children().length - 1 : -1
        this.setFocus();
      }, this);

      this.on('onselect', function() {
        this.trigger('selectedindex', this._currentIndex);
      }, this);

      this.on('onblur', this._onBlur, this);

      if (this.collection) {
        this.listenTo(this.collection, 'reset add remove', function() {
          _t._currentIndex = 0;
          _t.render();
          _t._maxIndex = _t.collection.length - 1;
        });
      } else {
        $log('in collection else loop')
        _t._currentIndex = 0;
      }

    },

    _incrementIndex: function() {
      if (this._currentIndex < this.max) {
        if ($(this.el).children().eq(this._currentIndex + 1).is(':visible')) {
          this._currentIndex++;
          this.trigger('newfocus', this._currentIndex);
          this.setFocus();
        }

      }
    },

    _decrementIndex: function() {
      if (this._currentIndex > 0) {
        this._currentIndex--;
        this.trigger('newfocus', this._currentIndex);
        this.setFocus();
      }
    },

    setFocus: function() {
      $log(" SET FOCUS ", this, $(this.el).children().length);
      this.$el.children().removeClass('focused');
      this.$el.children().eq(this._currentIndex).addClass('focused')

    },

    setSelected: function() {
      this.$el.children().removeClass('selected');
      this.$el.children().eq(this._currentIndex).addClass('selected');
    },

    unsetSelected: function() {
      this.$el.children().removeClass('selected');
    },

    _onBlur: function() {
      this.$el.children().removeClass("focused");
    },

    render: function() {
      $log(" LIST MENU ", this.options.template);
      if (_.isFunction(this.options.template) && this.collection && this.collection.length) {
        var items = this.collection.map(function(m) {
          return m.attributes
        });
        $log(" RENDERING ELEMENTS ")
        $(this.el).html(this.options.template({
          items: items
        }));
      }
      return this;
    }
  });

  return ListMenu;
})