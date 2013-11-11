define(['navigation'], function(Navigation) {
	return {
		fetchItem: function(url, parser, options) {

			options = _.isFunction(parser) ? options : parser;
			options = options || {};
			options = _.defaults(options,{
				url : url,
				// skipProxy: true,
				// xhrFields: {
				//   				withCredentials: true
				// 			},
				// 			crossDomain: true
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
					thumbnail: $(i).find('thumbnail').eq(0).attr('url')
				}
			})
		},
		fetchMRSS: function (url){
			return this.fetchItem(url,this.mrssParser);
		}
	}
})

/*a.fetchItem().done(function(d) {
	_($(d).find('item')).map(function(i) {
		return {
			title: $(i).find('title').text(),
			streamUrl: $(i).find('content').attr('url'),
			description: $(i).find('description').text(),
			thumbnail: $(i).find('thumbnail').attr('url')
		}
	})
})*/