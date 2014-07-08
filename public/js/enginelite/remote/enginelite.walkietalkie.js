/* globals io */
define(['jquery', 'underscore', 'backbone', 'tvengine'], function($, _, Backbone, TVEngine) {
  var WalkieTalkie = {

    socket: null,
    registered: null,
    devicetype: "Browser",

    links: {},
    currentLink: null,

    setLinked: function(data) {
      var name = this.getNewConnectionName();
      this.links[name] = data;
      localStorage.setItem("links", JSON.stringify(this.links));
      this.showLinkNameEditor(name);
      this.updateLinksList();
      this.switchLinked(name);
    },

    switchLinked: function(name) {
      this.currentLink = name;
      localStorage.setItem("lastLinked", name);
    },

    getNewConnectionName: function() {
      var name = "Conn";
      var names = _.keys(this.links);
      if (_.contains(names, name)) {
        var connStart = "Conn ",
          count = 1;
        name = connStart + count;
        while (_.contains(names, name)) {
          count++;
          name = connStart + count;
        }
      }
      return name;
    },
    renameLink: function(oldName, newName) {
      $log("renaming link from " + oldName + " to " + newName);
      if (oldName === newName) return;
      if (!oldName || !newName || newName.length < 4) {
        $error("Invalid New Name");
      } else {
        $log("Got New Name: " + newName)
        this.links[newName] = this.links[oldName];
        delete this.links[oldName];
        localStorage.setItem("links", JSON.stringify(this.links));
        this.updateLinksList();
        if (this.currentLink === oldName) {
          this.switchLinked(newName);
        }
        $log(this.links)
      }
    },
    getLinkCode: function() {
      $log("WalkieTalkie sending request for link code")
      this.socket.emit("device:getlinkcode");
    },

    showLinkNameEditor: function(name) {
      $("#oldName, #newName").val(name);
      $("#linkName").animate({
        translateY: '150px'
      }, 500, 'ease-in-out');
      $("#linkNameForm input").focus();
    },

    link: function(code) {
      $log("Got Link code: " + code)
      if (code.length == 4) {
        $log("Trying to link with Code: " + code);
        this.socket.emit("device:link", code);
      }
    },
    updateLinksList: function() {
      $(".linkselect").empty();
      _.each(this.links, function(link, name) {
        $(".linkselect").append($("<li>" + name + "</li>"))
      });
    },

    clearLocalStorage: function() {
      localStorage.removeItem("links");
      localStorage.removeItem("deviceid");
      localStorage.removeItem("lastLinked");
      this.currentLink = null;
    },

    loadFromLocalStorage: function() {
      this.links = JSON.parse(localStorage.getItem("links")) || {};
      this.deviceid = localStorage.getItem("deviceid");
      this.currentLink = localStorage.getItem("lastLinked") || _.keys(this.links)[0];
    },
    savedMessages: [],

    sendMessage: function(type, data, destination) {
      destination = destination || this.links[this.currentLink];
      $log("Trying to send message: " + type + ":" + data + " to : " + this.links[this.currentLink]);
      if (this.currentLink) {
        this.socket.emit("device:message", {
          token: destination,
          msg: {
            type: type,
            data: data
          }
        })
      } else {
        $log("No device linked?");
      }
    },


    setDeviceId: function(id) {
      $log("Setting device id: " + id);
      this.deviceid = id;
      localStorage.setItem("deviceid", id);
    },

    init: function() {
      var _t = this;
      this.loadFromLocalStorage();
      this.updateLinksList();

      // this.socket = io.connect('http://theknot.adifferentengine.com:8124');
      this.socket = io.connect('http://localhost:3000');
      this.socket.on("connect", function() {
        $log("Connected " + _t.deviceid);
        if (typeof _t.deviceid === 'undefined' || _t.deviceid === null) {
          $log("Don't have a deviceid, Getting that first ");
          _t.socket.emit("fetch-uuid");
        } else {
          $log("Have a deviceid, " + _t.deviceid + " registering this device ");
          _t.socket.emit("device:register", {
            devicetype: _t.devicetype,
            deviceid: _t.deviceid
          });
        }
      });

      this.socket.on("device:register:error", function(data) {
        $error("Failed to register device.", data);
      });

      this.socket.on("newuuid", function(data) {
        $log(" Got new UUID " + data + "now registering ");
        _t.clearLocalStorage() // $log);
        _t.setDeviceId(data);
        $log({
          deviceid: _t.deviceid,
          devicetype: _t.devicetype
        })
        _t.socket.emit("device:register", {
          deviceid: _t.deviceid,
          devicetype: _t.devicetype
        });
      })

      this.socket.on("device:registered", function() {
        $log("device:registered");
        _t.registered = true;
        var _this = this;
        this.emit("logger", "PLAFTFORM NAME: " + TVEngine.Platforms.platformName());
        TVEngine.on("tvengine:log", function(data) {
          _this.emit("logger", data);
        })
      });



      this.socket.on("control", function(data) {
        TVEngine.Keyhandler.trigger('keyhandler:' + data);
      });


      this.socket.on("device:linkcode", function(data) {
        $log("device:linkcode", data);
        _t.trigger("device:linkcode", false, data);
      });

      this.socket.on("device:linkcode:error", function(data) {
        _t.trigger("device:linkcode", data.msg, data);
      });

      this.socket.on("device:message", function(data) {
        $log("message:", data.type + ":" + data.message);
        _t.trigger(data.msg.type, {
          data: data.msg.data,
          responseToken: data.token
        });
      })

      this.socket.on("device:link", function(data) {
        $log("Got a new device link: " + data);
        _t.setLinked(data);
      })
      this.socket.on("device:link:error", function() {
        navigator.notification.alert("Unable to create link, please try again")
      });
    }
  }
  _.extend(WalkieTalkie, Backbone.Events);
  TVEngine.on("tvengine:starting", function() {
    TVEngine.WalkieTalkie.init();
  })
  return WalkieTalkie;
})