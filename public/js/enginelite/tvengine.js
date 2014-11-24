/*globals define, alert */

/**
 *
 *  Simple TV App Engine.
 *
 *  author: A Different Engine LLC.
 *  http://adifferentengine.com
 *  contact@adifferentengine.com
 *
 */

/* shim */

;(function(){
if(! Function.prototype.bind) {
    Function.prototype.bind = function(ctx){
        var fn = this;
        return function(){
            return fn.apply(ctx, arguments);
        }
    }
}
}());


define(['jquery', 'underscore', 'backbone', 'handlebars'], function($, _, Backbone, Handlebars) {
    window.$noop = function() {
        // if more then one return an array.
        if (arguments.length > 1) return Array.prototype.slice.call(arguments, 0);
        else return arguments[0]; // Don't return an array if only one thing came in.
    }
    window.$query = function(key) {
        key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
        var match = location.search.match(new RegExp("[?&]" + key + "=([^&]+)(&|$)"));
        return match && decodeURIComponent(match[1].replace(/\+/g, " "));
    }
    window.$storage = window.localStorage;

    // Updates to some better logging.
    var method;
    var methods = [
            'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
            'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
            'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
            'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];
        if (!console[method]) {
            console[method] = $noop;
        }
    }
    if (navigator.appVersion.search(/Maple2012/) > -1) {
        window.$log = alert;
    } else if (Function.prototype.bind) {
        window.$log = Function.prototype.bind.call(console.log, console);
        window.$error = Function.prototype.bind.call(console.error, console);
    } else {
        window.$log = function() {
            Function.prototype.apply.call(console.log, console, arguments);
        }
        window.$error = function() {
            Function.prototype.apply.call(console.error, console, arguments);
        }
    }

    // String Extensions
    String.prototype.normalize = function() {
        return this.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }

    String.prototype.ltrim = function() {
        var charlist = !arguments[0] ? ' \\s\u00A0' : (arguments[0] + '').replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
        var re = new RegExp('^[' + charlist + ']+', 'g');
        return this.replace(re, '');
    }

    String.prototype.rtrim = function() {
        var charlist = !arguments[0] ? ' \\s\u00A0' : (arguments[0] + '').replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '\\$1');
        var re = new RegExp('[' + charlist + ']+$', 'g');
        return this.replace(re, '');
    }
    String.prototype.trim = function() {
        return this.rtrim().ltrim();
    }

    String.prototype.capitalize = function() {
        return this.replace(/\S+/g, function(a) {
            return a.charAt(0).toUpperCase() + a.slice(1).toLowerCase();
        });
    };
    String.prototype.stripHTML = function() {
        return this.replace(/<(?:.|\n)*?>/gm, '');
    }
    String.prototype.toTitleCase = function() {
        return this.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };
    String.prototype.trunc = function(n, useWordBoundary) {
        var tooLong = this.length > n,
            s_ = tooLong ? this.substr(0, n - 1) : this;
        s_ = useWordBoundary && tooLong ? s_.substr(0, s_.lastIndexOf(' ')) : s_;
        return tooLong ? (s_ + '&hellip;').toString() : s_.toString();
    };

    $("<div />").ajaxError(function(e, aj, settings, exception) {
        $log(" ___ AJAX ERROR ___ ");
        $error(exception, settings);
        $log(" ___ END AJAX ERROR ___ ");
    });

    Handlebars.registerHelper("debug", function(optionalValue) {
        console.log("Current Context");
        console.log("====================");
        console.log(this);

        if (optionalValue) {
            console.log("Value");
            console.log("====================");
            console.log(optionalValue);
        }
    });

    var TVEngine = {
        deferreds: [],
        addStartupItem: function(item) {
            if(_.isObject(item) && _.isFunction(item.always)) {
                this.deferreds.push(item);
            } else {
                $error(new Error("Tried to add invalid startup dependency"));
            }
        },

        start: function(config) {
            $log("<<< TV ENGINE START >>>");
            this.config = config || {};
            this.trigger("tvengine:starting");
            var _t = this;
            $.when.apply(this, this.deferreds).always(function() {
                if(require.defined('keyhandler')) {
                    var keys = require('keyhandler');
                    keys.on('onExit', function() {
                        _t.exit();
                    });
                }
            }).done(function() {
                $log(" <<< TV ENGINE APP READY >>> ");
                _t.trigger("tvengine:appready");
            })
            .fail(function() {
                $log(" FAILED TO LOAD ALL ITEMS ");
            });
        },

        exit: function() {
            $log("********************************\n       EXIT     \n ********************************");
            this.trigger('exit');
        },
        exitToMenu: function() {
            $log("********************************\n       EXIT TO MENU     \n ********************************");
            this.trigger('exittomenu');
        }
    }
    _.extend(TVEngine, Backbone.Events);
    return TVEngine;
})
