/*
    Real simple global data store with some bindings on data updates.
*/
define(['underscore','backbone'], function( _, Backbone ) {
    'use strict';
    var DataStore = {
        _data: {},
        set: function(key, data, expires) {
            // Expires is a length of time in ms.
            expires = _.isNumber(expires) ? new Date().getTime() + expires : null;
            this._data[key] = {
                data: data,
                stored: new Date().getTime(),
                expires: expires
            }
            this.trigger("newdata:" + key, data);
            return this._data[key];
        },
        get: function(key) { /*the data store was returning an incorrect item during dev of surfline*/
            var value = this._data[key];
            if (!value) return null;
            if (value.expires !== null && value.expires < new Date().getTime()) {
                delete this._data[key];
                return null;
            } else {
                return value.data;
            }
        },
        // Ability to do a fuzzy test against keys, handy if you may want to set a bunch
        // of related values in a bunch of different places but access them at once so you
        // can have keys like myval:0, myval:1 etc and find them by DataStore.find(/$myval:/);
        find: function(test) {
            var out = [];
            _(this._data).each(function(value, key) {
                if (key.match(test)) out.push(value);
            });
            return out;
        }
    }
    _.extend(DataStore, Backbone.Events);
    return DataStore;
});