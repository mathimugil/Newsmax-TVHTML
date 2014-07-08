/* globals _ */

define(['jquery', 'backbone', 'underscore'], function($, Backbone, _) {
  var VASTFetcher = {
    fetchVASTUrl: function(url) {
      var d = new $.Deferred();
      this.fetchRemoteVastUrl(url, d);
      return d;
    },


    fetchRemoteVastUrl: function(url, deferred) {
      var _t = this;
      $log('fetching vast url = ', url);
      $.ajax({
        type: "GET",
        url: url,
        dataType: 'text',
        data: {
          mode: "native"
        },
        success: function(data) {
          data = _t.parseResponse(data);
          if (data && data.vastUrl) {
            _t.fetchRemoteVastUrl(data.vastUrl, deferred);
          } else if (!data || !data.renditions.length) {
            deferred.reject();
          } else {
            deferred.resolve(data);
          }
        },
        error: function() {
          $log(" ERROR FETCHING VAST URL ", arguments);
          deferred.reject();
        }

      })
    },

    //NOTE: we are forcing the response to be text and we are then converting the text to xml
    parseResponse: function(data) {
      if (_.isEmpty(data)) return null;

      data = $.parseXML(data.trim());
      var out = new VASTResponse();

      var vasttag = $(data).find("VASTAdTagURI");
      if (vasttag.length) {
        return {
          vastUrl: $(vasttag).first().text().trim()
        };
      }

      $(data).find("MediaFile").each(function(idx, file) {
        if ($(file).attr("type") == "video/mp4") {
          out.renditions.push({
            bitrate: $(file).attr("bitrate"),
            url: $(file).text().trim()
          });
        }
      });
      $(data).find("Tracking").each(function(idx, tracker) {
        out.setTrackingEvent($(tracker).attr('event'), $(tracker).text());
      });
      return out;
    }
  }
  var VASTResponse = VASTFetcher.VASTResponse = function() {
    this.duration = null;
    this.trackingEvents = {};
    this.renditions = [];
    this.eventsSent = [];
    this.timeEvents = {
      'start': 0,
      'firstQuartile': 0.25,
      'midpoint': 0.5,
      'thirdQuartile': 0.75
    };
  }


  VASTResponse.prototype.trackTimeEvent = function(current, duration) {
    var percent = current / duration;
    var _t = this;
    if (!_(this.eventsSent).include('start')) this.trackEvent('start');
    _.each(this.timeEvents, function(val, key) {
      if (percent > val && !_.include(_t.eventsSent, key)) {
        _t.trackEvent(key);
      }
    })
  }

  VASTResponse.prototype.trackEvent = function(key) {
    //$log("\n\n TRYING TO TRACK EVENT " + key + " \n\n");
    this.eventsSent.push(key);
    if (this.trackingEvents[key]) {
      _(this.trackingEvents[key]).each(function(tag) {
        //$log('we are trying to append an image tag to the document');
        $('body').append($("<img />").attr('src', tag).css('display', 'none'));
      });
    } else {
      //$log(" We Are Not Tracking Event: " + key);
    }
  },
  VASTResponse.prototype.resetEvents = function() {
    this.eventsSent = [];
  }
  VASTResponse.prototype.getRenditions = function() {
    return this.renditions;
  }
  VASTResponse.prototype.setTrackingEvent = function(event, url) {
    $log('setTrackingEvent called with event = ', event, url);
    this.trackingEvents[event] = _.isArray(this.trackingEvents[event]) ? this.trackingEvents[event] : [];
    this.trackingEvents[event].push(url);
  }
  VASTResponse.prototype.addMediaFile = function(bitrate, url) {
    $log('addMediaFile called');
    this.renditions.push({
      bitrate: bitrate,
      url: url
    });
  }

  VASTResponse.prototype.getRenditionForBitrate = function(bitrate) {
    bitrate = bitrate || 10000;
    if (this.renditions.length < 1) {
      // $log(" NO RENDITIONS FOR URL ");
      return null;
    }
    var file = null;
    _.each(this.renditions, function(rendition) {
      if (file === null || (rendition.bitrate > file.bitrate && rendition.bitrate < bitrate)) {
        file = rendition;
      }
    });
    // $log(" FOUND RENDITION FOR BITRATE " + file);
    // return {url:"https://s3.amazonaws.com/public.domain.video/vids/OldSpice.DidYouKnow.h264.1100.mp4"};
    return file;
  }

  return VASTFetcher;
});