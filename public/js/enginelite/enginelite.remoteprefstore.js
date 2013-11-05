define(['tvengine', 'appconfig', 'platform', 'underscore','jquery'], function(TVEngine, TVAppConfig, Platform, _, $) {

    var RemotePrefStore = {
        name: "RemotePrefStore",
        _preferences: null,
        _preferencesObject: null
    }

    RemotePrefStore.init = function() {
        if (!TVAppConfig || !TVAppConfig.parseAppId || !TVAppConfig.parseJSId) { //|| TVEngine.getPlatform().name=='sharp'){
            this.trigger("loadeduser");
            return;
        }

        this._preferencesObject = Parse.Object.extend("RemotePrefStore");
        Parse.initialize(TVAppConfig.parseAppId, TVAppConfig.parseJSId);

        var query = new Parse.Query(this._preferencesObject);
        query.equalTo("deviceid", Platform.deviceId());
        var _t = this;
        query.find({
            success: function(users) {
                if (users.length) {
                    _t._preferences = users[0];
                    _(users.slice(1)).each(function(u) { u.destroy() });
                } else {
                    _t._preferences = new _t._preferencesObject();
                    _t.set('deviceid', TVEngine.getPlatform().deviceId(), true);
                }
                _t.trigger("loadeduser");
            },
            error: function() {
                _t._preferences = new _t._preferencesObject();
                _t.set('deviceid', TVEngine.getPlatform().deviceId(), true);
                _t.trigger("loadeduser");
            }
        })
    },

    RemotePrefStore.get = function(key) {
        return (this._preferences) ? this._preferences.get(key) : null
    }

    RemotePrefStore.set = function(key, value, savenow) {
        this._preferences.set(key, value);
        var out = {};
        out[key] = value;
        this.trigger("newpreference", out);
        if (savenow) this.save();
    }

    RemotePrefStore.save = function() {
        var _t = this;
        this._preferences.save({
            success: function() {
                _t.trigger("saved")
            },
            error: function() {
                _t.trigger("savefailed")
            }
        })

    }
    $(window).on('unload', function() {
        $log(" UNLOAD TRUING TO SAVE !!! ")
        RemotePrefStore.save();
    });
    return RemotePrefStore;
});