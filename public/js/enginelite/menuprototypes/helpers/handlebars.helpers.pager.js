define(['handlebars'], function(Handlebars){
	var pager = function(index, breakpoint, snippet) {
		if (index !== 0  && ( index % breakpoint == 0 )) {
			return new Handlebars.SafeString(snippet);
		} 
	} 
	Handlebars.registerHelper("pager",pager);
});