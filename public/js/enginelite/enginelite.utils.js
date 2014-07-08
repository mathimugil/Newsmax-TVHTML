define(function() {
  return {
    getStringWidth: function(elm, sizeinpx, font) {
      elm = $(elm);
      sizeinpx = sizeinpx;
      font = "normal normal normal " + sizeinpx + "px/normal " + font || elm.css('font');
      var text = elm.text();
      var testDiv = $("<div></div>", {
        style: 'font: ' + font + ';position: absolute, top: -1000; display:inline-block '
      }).text(text);
      $("body").append(testDiv);
      var out = Math.ceil(testDiv.outerWidth());
      testDiv.remove();
      return out;
    },

    getRGBFromHex: function(hex, alpha) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

      if (!result) return null;

      var out = {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: alpha,
        toString: function() {
          if (isNaN(alpha)) return "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
          else return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")";
        }
      }
      return out;
    },
    convertMstoHumanReadable: function(ms, leadingZeros) {
      var days, hours, seconds, minutes, numSecs, x, numMins;
      leadingZeros = typeof(leadingZeros) == 'undefined' ? true : !! leadingZeros // Make sure its boolean
      x = ms / 1000
      numSecs = seconds = Math.floor(x % 60)
      x /= 60
      numMins = minutes = Math.floor(x % 60)
      x /= 60
      hours = Math.floor(x % 24)
      x /= 24
      days = Math.floor(x);

      var numMs = ms - (seconds * 1000);

      if (leadingZeros) {
        if (numSecs < 10) {
          numSecs = "0" + numSecs.toString();
        }
        if (numMins < 10) {
          numMins = "0" + numMins.toString();
        }
      }

      return {
        millis: numMs,
        seconds: numSecs,
        minutes: Math.floor(numMins),
        hours: Math.floor(hours),
        totalMS: ms,
        totalSeconds: ms / 1000,
        toString: function() {
          var str = numSecs;
          if (numSecs.toString().indexOf('-') > 0) numSecs = 0; //bug
          if (Math.floor(numMins)) str = numMins + ":" + str;
          else str = "00:" + str;
          if (Math.floor(hours)) str = hours + ":" + str;
          return str;
        }
      }
    }
  }
})