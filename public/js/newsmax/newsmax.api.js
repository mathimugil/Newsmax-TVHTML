define(['navigation','platform','config'], function(Navigation, Platform, conf) {
  var imageProcessingLink = "http://cdn.nmax.tv/NewsmaxVideoServices/api/Image?uri=";
  var imageSizeSlug = "&height=110&width=197";

	return {
		fetchItem: function(url, parser, options) {
            conf.pauseScreenhider = true;
			options = _.isFunction(parser) ? options : parser;
			options = _.defaults(options || {},{
				url : url,
				skipProxy: (document.location.href.indexOf("nmax") > 0 || !Platform.needsProxy)
				//skipProxy: true
			})

			return $.ajax(options).then(function(data) {
				if(_.isFunction(parser)) data = parser(data);
				return data;
			});
		},
		mrssParser: function (data) {
			return _($(data).find('item')).map(function(i) {
				return {
					title: $(i).find('title').eq(0).text(),
					streamUrl: $(i).find('content').eq(0).attr('url'),
					description: $(i).find('description').eq(0).text(),
					thumbnail: imageProcessingLink + $(i).find('thumbnail').eq(0).attr('url') + imageSizeSlug,
                    duration: $(i).find('content').eq(0).attr('duration')
				}
			})
		},
		fetchMRSS: function (url) {
			proxypath = (url.indexOf("www.nmax.tv") > 2)  ? 'proxy.api' : 'proxy.ooo';
			return this.fetchItem(url, this.mrssParser, {
				proxypath: proxypath
			});
		},
		fetchMainConfig: function () {
			var SN = Platform.deviceId();
			return this.fetchItem('http://cdn.nmax.tv/NewsmaxVideoServices/api/Configuration?DC=SmartTV&SN=' + SN, this.parseMainConfig, {
				proxypath:'proxy.cdn'
			})
		},
		parseMainConfig: function (data) {
			try{
				data = JSON.parse(data.configDocument.trim());
			} catch(e){
				$log(e)
			}
			return data;
		},
    doSearch: function (term){
      return this.fetchItem('http://cdn.nmax.tv/NewsmaxVideoServices/api/Search?Criteria=' + term, this.searchParser, {
        proxypath:'proxy.api'
      })
    },
    searchParser: function(data){
      $xmlDoc = $.parseXML( data.MRSS_Feed );
      $xml = $( $xmlDoc );

      var resultsArray = [];
      _($($xml).find('item')).map(function(i) {
        var newItem = {
          title: $(i).find('title').eq(0).text(),
          streamUrl: $(i).find('content').eq(0).attr('url'),
          description: $(i).find('description').eq(0).text(),
          thumbnail: imageProcessingLink + $(i).find('thumbnail').eq(0).attr('url') + imageSizeSlug,
          duration: $(i).find('content').eq(0).attr('duration')
        };
        if(_.findWhere(resultsArray, newItem) == null) resultsArray.push(newItem);
      })
      return resultsArray;
    }
	}
})