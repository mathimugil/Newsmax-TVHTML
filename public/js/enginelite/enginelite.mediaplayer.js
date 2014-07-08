define(['jquery', 'underscore', 'backbone', 'tvengine', 'platform', 'keyhandler', 'vastfetcher'], function($, _, Backbone, TVEngine, Platform, KeyHandler, VAST) {
    'use strict';
    var MediaPlayer = {
        _testUrl: null,
        // "http://assets.adifferentengine.com/SizedDownloads/512KB.json",
        _testSize: 512000,
        _active: false,
        userBitrate: 10000,
        name: "MediaPlayer",
        currentVideoItem: null,
        _nextItemToPlay: null,
        _timeUpdatesDisabled: false,

        _init: function() {
            this.currentVideoItem = new PlaylistItem(); // Just a generic Model we can bind to.
            this.on('onstop', this._cancelUrlFetch, this);
            if (_.isFunction(this.init)) this.init();
        },

        resetCoordinates: function() {
            this.setCoordinates(0, 0, Platform.resolution.width, Platform.resolution.height);
        },

        active: function() {
            this._active = true;
            KeyHandler.on("all", this._keyhandler, this);
        },

        deactive: function() {
            this._active = false;
            KeyHandler.off("all", this._keyhandler, this);
        },

        disableTimeUpdates: function() {
            this._timeUpdatesDisabled = true;
        },

        enableTimeUpdates: function() {
            this._timeUpdatesDisabled = false;
        },

        _keyhandler: function(event) {
            // $log("MediaPlayer Event Handler Got: " + event);
            event = event.replace("keyhandler:", "");
            switch (event) {
                case 'onPause':
                    this.trigger('paused')
                    this.pause();
                    break;
                case 'onPlay':
                    this.trigger('played')
                    this.play();
                    break;
                case 'onStop':
                    this.trigger('stopped')
                    this.stop();
                    break;
            }
        },

        setPlaylist: function(playlist, index) {
            $log(" SETTING NEW PLAYLIST ") //, playlist, index);

            if (this.playlist) {
                this.off(null, null, this.playlist);
            }
            this.playlist = playlist;
            this.playlist.reset();

            this.off(null, this.playlist.trackEvents, this.playlist);
            this.on('all', this.playlist.trackEvents, this.playlist);
            if (_.isNumber(index)) this.playlist.setCurrentIndex(index);
            this.currentStreamUrl = null;
            this.trigger("onnewplaylist", playlist);
        },


        getCurrentItem: function() {
            if (this.playlist) {
                return this.playlist.currentItem;
            } else {
                return null;
            }
        },

        currentItemIsAd: function() {
            return (this.playlist.currentStreamType == "preroll");
        },

        currentItemIsLive: function() {
            return (this.playlist.currentItem.get("isLive"));
        },

        playNextItem: function() {
            $log(" PLAY NEXT ITEM CALLED ")
            var index = this.playlist.currentItemIndex;
            $log(" PLAY NEXT ITEM CALLED " + index);
            if (index < this.playlist.length - 1) {
                index++;
                this.playItemAtIndex(index);
                return true;
            } else {
                return false;
            }
        },

        playPreviousItem: function() {
            var index = this.playlist.currentItemIndex;
            $log(" PLAY PREVIOUS ITEM CALLED " + index);
            if (index > 0) {
                index--;
                this.playItemAtIndex(index);
                return true;
            } else {
                return false;
            }
        },

        playUrl: function(url, dontstart) {
            var playlist = new Playlist();
            playlist.addVideo(url);
            this.setPlaylist(playlist);
            if(!dontstart) this.play();
        },

        playItemAtIndex: function(index, startOffset) {
            $log(" PLAYING ITEM AT INDEX " + index);
            this.stop();
            this.currentStreamUrl = null;
            if (_.isNumber(startOffset)) {
                var item = this.playlist.at(index);
                item.set("startPosition", startOffset);
            }
            this.playlist.setCurrentIndex(index);
            this.play();
        },
        _cancelUrlFetch: function() {
            $log(" Canceling URL Fetch");
            if (this.nextVideoUrlDeferred) this.nextVideoUrlDeferred.resolve("canceled");
        },

        nextVideo: function() {
            $log("___ NEXT VIDEO ___ ");

            var _t = this;

            this.nextVideoUrlDeferred = this.playlist.fetchNextVideoUrl();
            this.nextVideoUrlDeferred.done(function(url, startOffset) {
                if (url === "canceled") return;
                $log(" GOT NEXT VIDEO URL ", url);
                if (url) {
                    startOffset = _.isNumber(startOffset) ? startOffset : 0;
                    if (_t.currentStreamUrl != url) {
                        _t.currentVideoItem.set(_t.playlist.currentItem.attributes);
                        $log(" TRIGGERING PLAYLIST NEXT VIDEO ");
                        _t.trigger("playlist:nextvideo", _t.playlist.currentItem);
                        $log(" AFTER TRIGGERING NEXT VIDEO ")
                    }
                    _t.currentStreamUrl = url;
                    _t._playVideo(url, startOffset);
                } else { // NO URL MEANS THE PLAYLIST ENDED
                    _t.trigger("playlist:ended");
                }
            })
                .fail(function() {
                $log(" FAILED TO GET NEXT PLAYLIST ITEM URL, WHAT DO WE DO? TRY NEXT ! ");
                _t.nextVideo();
            });
        },
        togglePlayPause: function() {
            if (this.playing()) {
                // $log(" We're Playing Trying to pause ")
                this.pause();
            } else {
                // $log(" We're Paused Trying to Resume ")
                this.play();
            }
        },
        setUserBitrate: function(bitrate) {
            // $log(" SETTING BITRATE TO " + bitrate);
            this.userBitrate = bitrate;
        }

    }

    _.extend(MediaPlayer, Backbone.Events);

    var Playlist = MediaPlayer.Playlist = function() {
        this.playlistItems = [];
        this.looping = false;
        this.currentItem = null;
        this.currentUrl = null;
        this.currentItemType = null;
        this._forceNextItem = null;
        this.videosContainsAudio = true;
        this.isPlaying = false;
        return this;
    }

    Playlist.prototype.reset = function() {
        this.currentItem = null;
        this.currentUrl = null;
        this.currentItemType = null;
    }



    Playlist.prototype.trackEvents = function(e, p) {

        if (this.currentStreamType == "preroll" && this.currentVastResponse) {

            switch (e) {
                case 'play':
                    MediaPlayer.trigger('vastPrerollStart');
                    break;
                case 'timeupdate':
                    this.currentVastResponse.trackTimeEvent(p, MediaPlayer.duration());
                    break;
                case 'videoend':
                    $log(' !!!vast complete triggering vastPreRolLDone');
                    this.currentVastResponse.trackEvent('complete');
                    MediaPlayer.trigger('vastPrerollDone');
                    break;
                case 'onresume':
                    this.currentVastResponse.trackEvent('play');
                    break;
                case 'pause':
                    this.currentVastResponse.trackEvent('pause');
                    break;
            }
        }
    }
    window.VideoDetails = Backbone.Model.extend({});



    Playlist.prototype.addVideo = function(vid) {
        var item = new PlaylistItem();
        if (_.isObject(vid) && vid.url) {
            item.addRendition({
                url: vid.url,
                bitrate: vid.bitrate
            });
        } else if (_.isString(vid)) {
            item.addRendition({
                url: vid,
                bitrate: null
            });
        } else {
            $log(" TRIED TO ADD AN INVALID VIDEO ");
            return;
        }
        this.addItem(item);
    }


    Playlist.prototype.setUserBitrate = function(bitrate) {
        this.userBitrate = bitrate;
    }


    Playlist.prototype.addItem = function(item) {
        //TODO: SHOULD VALIDATE ITEM
        if (item instanceof Array) {
            this.playlistItems = _.flatten(this.playlistItems, item);
        } else {
            this.playlistItems.push(item);
        }
        this.length = this.playlistItems.length;
        // $log(this.playlistItems);
    }

    Playlist.prototype.loop = function(toLoop) {
        this.looping = !! toLoop; // force a boolean
    }


    Playlist.prototype.fetchNextVideoUrl = function() {
        $log(" FETCH NEXT VIDEO URL ")
        $log(' CURRENT STREAM TYPE = ', this.currentStreamType);
        //this.currentStreamType = null;

        if (!this.currentStreamType || this.currentStreamType == "contentstream") {
            if (_.isNumber(this._forceNextItem)) {
                $log(" FORCING NEXT ITEM ")
                this.currentItemIndex = this._forceNextItem;
                this._forceNextItem = null;
            } else if (!_.isNumber(this.currentItemIndex)) {
                $log(" NO CURRENT ITEM INDEX, SETTING TO 0")
                this.currentItemIndex = 0;
            } else {
                $log(" INCREMENTING CURRENT ITEM INDEX ");
                this.currentItemIndex++;
            }
        }
        $log(' CURRENT ITEM INDEX = ', this.currentItemIndex, this.currentItem);

        var nextItem = this.at(this.currentItemIndex);
        $log(" NEXT ITME", nextItem);

        if (this.currentItem != nextItem && nextItem) {
            $log(" TRIGGERING NEW PLAYLIST ITEM "); //, nextItem)
            MediaPlayer.trigger('playlist:newplaylistitem', nextItem);
        }

        this.currentItem = nextItem;
        var deferred = new $.Deferred();

        if (!this.currentItem) {
            // $log(" NO CURRENT ITEM, CHECKING FOR LOOP ");
            if (!this.looping) {
                this.reset();
                deferred.resolve(null);
                return deferred;
            } else {
                this.reset();
                this.currentItemIndex = 0;
                this.currentItem = this.at(this.currentItemIndex);
            }
        }

        if (this.currentStreamType == "preroll" || this.currentItem._vastPrerollUrl === null) {
            $log(" PLAYING CONTENT STREAM "); //, this.currentItem)
            return this.playContentStream(this.currentItem);
        } else if (this.currentItem._vastPrerollUrl) {
            var _t = this;
            if (Platform.name === "lg") {
                var addef = Platform.adPlayer.play();
                addef.done(function() {
                    _t.playContentStream(_t.currentItem)
                        .done(function(u, p) {
                        deferred.resolve(u, p);
                    })
                        .fail(function() {
                        deferred.reject('Got something bad... ');
                    });
                });
            } else {
                VAST.fetchVASTUrl(this.currentItem._vastPrerollUrl)
                    .done(function(vastResponse) {
                    _t.currentStreamType = "preroll";
                    _t.currentVastResponse = vastResponse;
                    var rendition = vastResponse.getRenditionForBitrate(this.userBitrate);
                    deferred.resolve(rendition.url);
                })
                    .fail(function() {
                    _t.playContentStream(_t.currentItem)
                        .done(function(u, p) {
                        deferred.resolve(u, p);
                    })
                        .fail(function() {
                        deferred.reject('Got something bad... ');
                    })
                })
            }
        } else {
            return this.playContentStream(this.currentItem);
        }
        return deferred;
    }

    Playlist.prototype.playContentStream = function(item) {
        $log('playContentStream called '); //with item = ', item);
        var deferred = new $.Deferred();

        this.currentStreamType = "contentstream";
        this.currentVastResponse = null;
        this.currentItem = item;

        $log(" GETTING RENDITION PROMISE ", item, this.userBitrate);
        var promise = item.getRendition(this.userBitrate);


        promise.done(function(rendition) {
            $log(" PROMISE TO GET RENDITION IS DONE "); //, this, rendition);
            deferred.resolve(rendition.url, item.get('startPosition'));
        })
            .fail(function() {
            deferred.reject('Failed to get Rendition');
        })

        return deferred;
    }

    Playlist.prototype.setStreams = function(streams) {
        streams = _.isArray(streams) ? streams : [streams];
        _.each(streams, function(s) {
            var item = new PlaylistItem();
            item.addRenditions(s);
            this.addItem(item);
        }, this)
    }


    Playlist.prototype.at = function(index) {
        return this.playlistItems[index]
    }
    Playlist.prototype.insertBefore = function(item, index) {
        index = _.isNumber(index) ? index : 0;
        this.playlistItems.splice(index, 0, item);
    }
    Playlist.prototype.insertAfter = function(item, index) {
        index = _.isNumber(index) ? index : 0;
        index++;
        this.playlistItems.splice(index, 0, item);
    }
    Playlist.prototype.setCurrentIndex = function(index) {
        $log(" ---- PLAYLIST SET CURRENT INDEX TO " + index)
        this.reset();
        this._forceNextItem = index;
    }
    var PlaylistItem = MediaPlayer.PlaylistItem = Backbone.Model.extend({
        defaults: {
            type: "video",
            _vastPrerollUrl: null,
            currentRendition: {
                url: null,
                bitrate: null
            },
            title: "",
            description: "",
            startPosition: 0,
            isLive: false,
            useRenditionsOnce: false
        }
    })


    PlaylistItem.prototype.getRendition = function(bitrate) {


        var deferred = new $.Deferred();
        var renditions = this.get("renditions");

        // Don't have renditions or a way to fetch renditions.
        //
        if (renditions && renditions.length) {
            $log(" WE HAVE RENDITIONS FOR THIS VIDEO SO WE ARE RETURNING THOSE ")
            var file = null;
            _.each(renditions, function(rendition) {
                if (file === null || (rendition.bitrate > file.bitrate && rendition.bitrate < bitrate)) {
                    file = rendition;
                }
            });
            this.set("currentRendition", file);
            deferred.resolve(file);
        } else if ((!renditions || !renditions.length) && !_.isFunction(this._renditionFetcher)) {
            $log(" NO RENDITIONS AND NO WAY TO FETCH THEM, FAILING AND BAILING ")
            this.set("currentRendition", {
                url: null,
                bitrate: null
            });
            deferred.reject();
        } else if (_.isFunction(this._renditionFetcher)) {
            $log(" NO RENDITIONS AND FETCHER, FETCHING ")
            var _t = this;
            this._renditionFetcher(function(renditions) {
                $log(" RENDITION FETCHER ", renditions);
                if (renditions) {
                    renditions = _.isArray(renditions) ? renditions : [renditions];
                    if (!_t.get("useRenditionsOnce")) _t.set('renditions', renditions);
                    var file = null;
                    _.each(renditions, function(rendition) {
                        if (file === null || (rendition.bitrate > file.bitrate && rendition.bitrate < bitrate)) {
                            file = rendition;
                        }
                    });
                    _t.set("currentRendition", file);
                    $log(" GOT CURRENT RENDITION FROM FETCHER ", file);
                    deferred.resolve(file);
                } else {
                    $log(" DIDN'T GET RENDITIONS BACK SO REJECTING !! ")
                    deferred.reject();
                }
            });
        } else { //  I have no idea how we got here.
            $log(" UNKNOWN ERROR REJECTING ")
            deferred.reject();
        }


        return deferred.promise();
    }
    PlaylistItem.prototype.addRendition = function(r) {
        // $log(" ADDING Rendition ", r);
        if (!r.url) {
            $error("TRYING TO ADD RENDITION WTH INVAID URL: " + r.url);
        } else {
            var renditions = this.get("renditions");
            // $log(" Current Renditions ", renditions)
            renditions = renditions || [];
            renditions.push(r);
            // $log(" SETTING ")
            this.set("renditions", renditions);
            // $log(" DONE SETTING ")
        }
    }

    PlaylistItem.prototype.addRenditions = function(r) {
        var renditions = r instanceof Array ? r : [r];
        var _t = this;
        // $log(" ADD RENDITIONS ",renditions)
        _.each(renditions, function(rendition) {
            _t.addRendition(rendition);
        });
    }
    PlaylistItem.prototype.addVastPrerollUrl = function(r) {
        this._vastPrerollUrl = r;
    }

    PlaylistItem.prototype.addRenditionFetchMethod = function(method, useRenditionsOnce) {
        this._renditionFetcher = method;
        this.set("useRenditionsOnce", useRenditionsOnce);
    }

    PlaylistItem.prototype.setUrl = function(url) {
        this.addRendition({
            url: url
        });
    }

    TVEngine.on('tvengine:starting', function() {
        MediaPlayer._init();
    });

    return MediaPlayer;
});
