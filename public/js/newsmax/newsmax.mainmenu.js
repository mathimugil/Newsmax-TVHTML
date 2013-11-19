define(['newsmax/newsmax.api', 'newsmax/newsmax.utils'], function(API, Utils) {
    
    //return 
    return API.fetchMainConfig().then(function(data){
        $log('data', data);
        var out =  _(data.categories).map(function(category){
           action = category.url.match(/\.m3u8$/) ? 'livefeed' : 'subcategory';

            if (action == "subcategory") {
                action = (!category.feeds || category.feeds.length === 0) ? "videos":"subcategory";
            }  
           return  _.extend(category, {
                action:action, 
                subcategory: (category.feeds && category.feeds.length) ? new Utils.categoryCollection(category.feeds) : null,
                feeds: null,
            })
        });
        
       var live = _(out).find(function(cat) {
        return (cat.action == "livefeed")
       });
       
       out = _(out).filter(function(cat) {
            return (cat.action !== "livefeed")
       });
       
       out.push({
            title: 'Search',
            action: 'search'
        });
        
       out.unshift(live);
       $log("OUT", out);
       
       return new Utils.categoryCollection(out);
       
    });
})