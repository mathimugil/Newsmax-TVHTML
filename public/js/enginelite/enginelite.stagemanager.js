define(['tvengine', 'navigation', 'keyhandler','jquery','underscore','backbone'], function(TVEngine, Navigation, KeyHandler, $, _, Backbone) {
  var $noop = function() { return };

  var StageManager = {
    _scenes: [],
    name: "Stage Manager",
    _setDefaultScene: null,
    _stateChangeParams: {
      newstate: null,
      params: {}
    },
    _changingScene: false,

    setDefaultScene: function(scene) {
      this._setDefaultScene = scene;
    },

    // Optional
    stateIs: function(name, scene) {
      if (scene === null) return (this.currentStateName() == name); // Optionally can validate against a scene.
      else return (this.sceneIs(scene) && this.currentStateName() == name);
    },
    sceneIs: function(name) {
      // $log(" SCENE IS CHECK, NAME: " + name, this.scene)
      return (this.scene && this.scene.name == name);
    },
    addScene: function(scene) {
      if (!scene.name ) {
        $error("Can't add a scene without a name ");
        return;
      }
      if (_.find(this._scenes, function(s) { return (s.name == scene.name); })) {
        $error("Trying to add a scene with a name that has already been added, perhaps the name is not unique? ");
        return;
      }
      this._scenes.push(scene);
    },
    currentStateName: function() {
      return (this.scene && this.scene.currentState && this.scene.currentState.name) ? this.scene.currentState.name : null;
    },

    _defaultScene: function() {
      // $log(" Looing for default Scene: ", this._setDefaultScene, this._scenes)
      if (this._setDefaultScene) {
        var _t = this;
        var scene = _.find(this._scenes, function(s) {
          // $log("testing "+s.name+" to " + _t._setDefaultScene  )
          return (s.name == _t._setDefaultScene);
        });
        // $("SCENE: ", scene)
        if (scene) return scene;
      }

      var d = _.find(this._scenes, function(s) {
        return s.defaultScene;
      });
      // $log(" Did we find a set default scene? ", d);
      if (d) return d;
      else if (this._scenes.length) {
        // $(" I Guess not lets find the first one, ", _.first(this._scenes))
        return _.first(this._scenes);
      }
    },

    start: function() {
      var d;
      if ((d = this._defaultScene())) {
        this.changeScene(d.name);
      }
    },

    setStateChangeParams: function(newstate, params) {
      params = params || {};
      this._stateChangeParams = {
        newstate: newstate,
        params: params
      };
      // $log(" SET STATE CHANGE PARAMS ", this._stateChangeParams)
    },

    changeScene: function(newscene, params) {
     $log("NEW SCENE: ", newscene);
     var splits = newscene.match(/^(.[^:]*):?(.*)$/), newstate;
     newscene = splits[1];
     newstate = splits[2];
      // VALIDATE THE SCENE CHANGE
      if (this._changingScene) {
        $error(" Can't change scene in the middle of a scene change ");
        return;
      }

      // Just storing the name
      var sname = newscene;
      if (typeof newscene == "string") newscene = _.find(this._scenes, function(s) {
        return s.name == newscene;
      });
      if (!newscene) return $error("Tried to load an invalid scene '" + sname + "'.");
      if(this.scene) this._last = { scene: this.scene.name, state: this.currentStateName};


      this.setStateChangeParams(newstate, params);

      this._changingScene = true; // Lock scene changes

      if (this.scene && this.scene.name == newscene) {
       // $log(" CHANGE SCENE WAS CALLED WITH THE SAME SCENE, SEEING IF THERE'S A NEW STATE ")
        if ( newstate &&  newstate != this.scene.currentState ) {
          this.scene.changeState(newstate);
          this._changingScene = false;
        }
        return;
      }
      // Clean up the old scene.
      if (this.scene && this.scene.currentState && _.isFunction(this.scene.currentState.onleavestate)) this.scene.currentState.onleavestate();
     if(this.scene && _.isFunction(this.scene.onleavescene)) this.scene.onleavescene();
      // $log(" TRIGGERING BEFORE SCENE CHANGE, NEWSCENE: ", newscene)
      var oldScene = this.scene;
      this.scene = newscene;
      this.trigger("beforescenechange",this.scene, oldScene);
      if ( this.scene.view || (_.isArray(this.scene.views) && this.scene.views.length)) {
        this.loadViewForScene();
      } else {
        this._sceneChanged();
      }
    },

    loadViewForScene: function() {
      var _t = this;
      // $log(" LOAD VIEW FOR SCENE ")
      //
      var views = (_.isArray(this.scene.views)) ? this.scene.views : [];
      // This is here to not break old API versions.
      if(this.scene.view && this.scene.target) views.push({view: this.scene.view, target: this.scene.target});
      var deferreds = _.chain(views).map(function (view) {
        var deferred = new $.Deferred(), _t = this;
        if ($(view.target).attr('data-currentscene') === this.scene.name) return;
        $(view.target).load(view.view, function() {
          $(this).attr('data-currentscene', _t.scene.name );
          deferred.resolve("TEST");
        });
        return deferred;
      }, this).without(null).value();
      // Careful, note the apply to splat the array of deferreds
      $.when.apply(null, deferreds).done(function() {
        _t.trigger('viewsloaded');
        _t._sceneChanged();
      }).fail(function() {
        _t.trigger('error', "Unable to load a view");
        _t.sceneChanged();
      });
    },

    // Really kind of confusing but this is the end of the chain for a scene change.
    changeSceneToDefaultState: function() {
      this.scene.persist.params = this._stateChangeParams.params;
      var d = new $.Deferred(), done;
      if(_.isFunction(this.scene.onenterscene) && (done = this.scene.onenterscene())) d = done;
      else d.resolve();
      var _t = this;
      d.always(function() {
        _t.scene.changeToDefaultState(_t._stateChangeParams.newstate);
      });
    },

    getScene: function(name) {
      return _.find(this._scenes, function(s) { return (s.name == name); });
    },

    _sceneChanged: function() {

      if (!this._initialized) {
        // $logthis)
        this.trigger("loaded");
        this._initialzied = true;
      }
      this._changingScene = false; // Unlock for changes;
      this.changeSceneToDefaultState();
      this.trigger("afterscenechange", this.scene);
    }
  };

  _.extend(StageManager, Backbone.Events);


  TVEngine.on("tvengine:appready", function() {
      StageManager.start();
  });


  var StageHistory = StageManager.StageHistory =  {
    _stack: [], _trackingScene: null, _enabled: true, _currentSceneAndState: {},
    init: function() {
    	$log(" STAGE HISTORY INIT ");
      StageManager.off(null, null, this); // Ensure we never track twice
      StageManager.on("afterscenechange", this._changeCurrentScene, this);
      KeyHandler.off(null, null, this.back);
      KeyHandler.on("onReturn",  this._checkOrBack, this);
    },


    add: function(current) {
     // $log(" HISTORY ADDING SCENE: " + current.scene + " STATE: " + current.state + " params: ", current.params);
      if(!current || _.isEmpty(current)) return;
      this._stack.unshift({ scene: current.scene, state: current.state, params: current.params || {} });
      KeyHandler.incrementStupidCounter();
    },


    back: function(params) {
      params = params || {};
     // $log(" CREATING PARAMS ")
      var sceneParams =   StageManager.scene.backParams || {};
      _.extend(sceneParams, params);
      if(!this._enabled) return;
      // window.history.back();
      var changeTo = this._stack.shift();

      if(!changeTo && StageManager.scene.parentScene) {
        changeTo = {
          scene: StageManager.scene.parentScene
        };
      }
      this._currentSceneAndState = {}; // Don't store the current Stuff in history.
      if(!changeTo || _.isEmpty(changeTo)) {
        $log(" NOTHING TO CHANGE TO SO EXITING TO MENU ");
        TVEngine.exitToMenu();
        return;
      }
      _.extend(changeTo.params , sceneParams);
      StageManager.changeScene(changeTo.scene+":"+changeTo.state, changeTo.params);
    },

    _checkOrBack: function() {
      var currentScene = StageManager.scene;
      $log(" CHECK OR BACK !!! ", currentScene.backhandler);
      if(_.isFunction(currentScene.handlesback) ) {
        // Scene is handling back button, see if it still wants to change the scene.
        if( !currentScene.handlesback() ) {
          KeyHandler.incrementStupidCounter();
          return true;
        }
      }
      if(!StageManager._changingScene) {
        this.back();
      } else {
        KeyHandler.incrementStupidCounter();
      }
    },

    _changeCurrentScene: function() {
      var currentScene = StageManager.scene;
      // $log(" SCENE CHANGED: " + currentScene.name + " am I saving this? " + currentScene.saveState);
      if(this._trackingScene) this._trackingScene.off(null, null, this);
      if( !currentScene.saveState ) return;

      this._trackingScene = currentScene;
      if(!_.isEmpty(this._currentSceneAndState)) {
        this.add(this._currentSceneAndState);
      }
      this._trackingScene.on('statechange', this._stateChanged, this);
     // $log(" CURRENT SCENE ", _.extend({}, currentScene.persist), _.keys(currentScene.persist));
      this._currentSceneAndState = {
        scene:  currentScene.name,
        params: currentScene.persist.params || {},
        state: (currentScene.currentState) ? currentScene.currentState.name : null
      };
      //$log(" TRACKING CURRENT SCENE AND STATE ", this._currentSceneAndState)
    },
    _stateChanged: function() {
      this._currentSceneAndState.state = (this._trackingScene.currentState) ? this._trackingScene.currentState.name : null;
    },
    enable: function() { this._enabled = true; },
    disable: function() { this._enabled = false; }
  }
  StageHistory.init();

  var Scene = StageManager.Scene = function(config) {
    this.currentState = null;
    this.saveState = true;
    this._states = {};
    this.onenterscene = $noop;
    this.onleavescene = $noop;
    this.transitions = {};
    _.extend(this, config || {});
    this.persist = {};
    _.extend(this, Backbone.Events);
    this._lastState = null;
    StageManager.addScene(this);
    return this;
  }


  Scene.prototype.stateis = function () {
    if(!this.currentState) return false;
    else return this.currentState.name;
  }

  Scene.prototype.addState = function(state, def) {
    if (!state.name) {
      $error("Tried to add a state without a name. ");
      return;
    }
    var _t = this;
    this.s = this.s || {};
    this.s[state.name] = function() {
      _t.changeState(state.name);
    };
    state.scene = this;
    this._states[state.name] = state;
    if (def) this._defaultState = state.name;
  };

  Scene.prototype.getDefaultState = function() {
    if (this._defaultState) return this._defaultState;
    else if (!_.isEmpty(this._states)) return (_.first(_.keys(this._states)));
  };

  Scene.prototype.setDefaultState = function(state) {
    if(this._states[state]) this._defaultState = state;
    else $error(" TRIED TO SET DEFAULT STATE TO AN INVALID STATE " + state);
  };

  Scene.prototype.changeToDefaultState = function(newstate) {
    // $log(" Changing to default state newstate? " + newstate);
    if (newstate) this.changeState(newstate, true);
    else  {
      newstate = this.getDefaultState()
      if(newstate) this.changeState(newstate, true);
      else {
        $log(" Current scene seems to have no states, defined, so we're not switching to one.");
      }
    }
  }

  Scene.prototype.createState = function(name, def) {
    var State = function (name) {
      this.name = name;
      this.onenterstate = $noop;
      this.onafterstate = $noop;
      this.scene = null;
    }
    var s = new State(name);
    this.addState(s, def);
    return s;
  }

  Scene.prototype.changeState = function(newstate, force) {
    var oldstate;
    if(StageManager.scene !== this){
      $error("trying to change state from scene that is not the current scene", newstate, this);
      return;
    }
    // $log(" Changing State from: " + this.currentState + " to: " +newstate)
    Navigation.disable();
    if (!force && (!_.isNull(this.currentState) && this.currentState.name === newstate)) {
      Navigation.enable();
      return;
    }

    // We're allowing for variable types of arguments, menu is optional
    this.trigger('newstate', newstate);

    var state = this._states[newstate];
    if (this.currentState && _.isFunction(this.currentState.onleavestate))
        this.currentState.onleavestate();

    // $("[data-scene~='" + this.name.toLowerCase() + "']").hide();
    var check = this.name.toLowerCase()+":"+newstate.toLowerCase();
    // $log(" HIDING WRONG STATES ",$("*[data-state]").length, $("[data-state~='"+check+"']"), $("*[data-state]").not("[data-state~='"+check+"']"));
    $("*[data-state]").not("[data-state~='"+check+"']").hide();
   // $log(" CHECKING FOR STATES NAMED: " + check);
    $("[data-state~='" + check + "']").show();



    if (this.currentState) {
      if(_.isFunction(this.currentState.onleavestate)) this.currentState.onleavestate();
      oldstate = this.currentState.name;
      newstate = state.name;
    }
    this.currentState = state;
    Navigation.enable();
   //  $log(" ON ENTER STATE? ", this.currentState)
    if(oldstate) {

      var transitionMethod = "onleave." + oldstate.toLowerCase() + ".onenter." + newstate.toLowerCase();
//      $log(" LOOKING FOR TRANSITION METHOD " + transitionMethod, this.transitions);
      if(_.isFunction(this.transitions[transitionMethod]) ) {
        $log(" FOUND TRANSITION METHOD " + transitionMethod);
        this.transitions[transitionMethod]();
      }
    }
    if (this.currentState && _.isFunction(this.currentState.onenterstate)) this.currentState.onenterstate();
    this._lastState = newstate;
    this.trigger("statechange", newstate);

  }

  Scene.prototype.addTransitionMethod = function(oldstate, newstate, method) {
    var _t = this;
    this.transitions["onleave." + oldstate.toLowerCase() + ".onenter." + newstate.toLowerCase()] = function() {
      method.call(_t);
    }
  }
  return StageManager;
});
