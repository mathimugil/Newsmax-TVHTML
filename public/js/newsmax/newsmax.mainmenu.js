define(['newsmax/newsmax.api', 'newsmax/newsmax.utils'], function(API, Utils) {
    
    //return 
    return API.fetchMainConfig().then(function(data){
        $log('data', data);
        var out =  _(data.categories).map(function(categorie){
           action = categorie.url.match(/\.m3u8$/) ? 'livefeed' : 'subcategory';

            if (action == "subcategory") {
                action = (!categorie.feeds || categorie.feeds.length === 0) ? "videos":"subcategory";
            }  
           return  _.extend(categorie, {
                action:action, 
                subcategory: (categorie.feeds && categorie.feeds.length) ? new Utils.categoryCollection(categorie.feeds) : null,
                feeds: null,
            })
        });
        
       var live = _(out).find(function(cat) {
        return (cat.action == "livefeed")
       })
       out = _(out).filter(function(cat) {
            return (cat.action !== "livefeed")
       });
       out.unshift({
            title: 'Search',
            action: 'search'
        })
       out.unshift(live);

       $log("OUT", out);
       return new Utils.categoryCollection(out);
    });

})