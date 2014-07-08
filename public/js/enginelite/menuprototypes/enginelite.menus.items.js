
define(['navigation','underscore'], function(Navigation, _) {

  var ItemMenu = Navigation.Menu.extend({
    _currentItem: null,
    initialize: function() {
      Navigation.Menu.prototype.initialize.call(this); // Don't kill these.
      var _t = this;
      var myevents = ['onright','onleft','onup','ondown','onselect'];
      _(myevents).each(function(e) {
        _t.on(e, function() {
          _t.delegateEvent(e);
        });
      });
      this.on('onfocus', this._onFocus, this);
      this.on('onblur', this._onBlur, this);
    },

    addItem: function(key, item) {
       this._menuItems = this._menuItems || {};
       this._menuItems[key] = item;
    },

    changeFocus: function (item) {
      if(!this._menuItems[item]) return $error("Tried to focus on something bad. " + item);
      if(this.focused) this.delegateEvent('onblur'); //visible changes only when focued
      this._currentItem = {
        name: item,
        actions: this._menuItems[item]
      }
      if (this.focused) this.delegateEvent('onfocus'); //visible changes only when focued
    },


    _onFocus: function () {
      $log(" ON FOCUS OF ITEM MENU ")
      this._getItem();
      if(_.isFunction(this.onFocus)) this.onFocus();
      this.delegateEvent('onfocus');
    },

    _onBlur: function () {
      if(_.isFunction(this.onBlur)) this.onBlur();
      this.delegateEvent('onblur');
    },

    _getItem: function() {
      if(this._currentItem) return;
      this._menuItems = this._menuItems || {};
      var k = _.keys(this._menuItems);
      if(k && k.length) {
        this._currentItem = {
          name: k[0], actions: this._menuItems[k[0]]
        }
      } else {
        $error(" ITEM MENU hAS NO ITEMS", this);
      }
    },

    delegateEvent: function(action) {
      $log(" DELEGATING EVENT ", this._currentItem, action);
      if(this._currentItem && this._currentItem.actions && _.isFunction(this._currentItem.actions[action])) {
        this._currentItem.actions[action].call(this);
      }
      if(this._currentItem) this.trigger(this._currentItem.name.toLowerCase() + ":" + action);
    }
  });

  return ItemMenu;

});