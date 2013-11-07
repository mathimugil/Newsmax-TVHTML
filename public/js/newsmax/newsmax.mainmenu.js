define(['backbone', 'underscore', 'newsmax/newsmax.utils'], function(Backbone, _, Utils) {
    var count = 0;
    var financeSubs = [{
        title: 'Spotlight',
    }, {
        title: 'Finance and Investing',
    }, {
        title: 'Domestic',
    }, {
        title: 'International',
    }, {
        title: 'Stocks',
    }, {
        title: 'Commodities',
    }];

    var specialsubs = [{
        title: 'Spotlight',
    }, {
        title: 'Shows',
    }, {
        title: 'Documentaries',
    }, {
        title: 'Other Programming',
    }];

    var healthSubs = [{
        title: 'Spotlight',
    }, {
        title: 'Featured',
    }, {
        title: 'Cancer',
    }, {
        title: 'Heart',
    }, {
        title: 'Brain',
    }, {
        title: 'Diet',
    }, {
        title: 'Natural Health',
    }, {
        title: 'Anti-Aging',
    }];

    var interviews = [
    {
        title: 'Spotlight'
    }, {
        title: 'Economic',
    }, {
        title: 'Recent Episodes'
    }, {
        title: 'Clips',
    }, {
        title: 'Highlights',
    }, {
        title: 'Archive',
    }];

    var categories = new Utils.categoryCollection([

        {
            title: 'NewsMax Live',
            action: 'livefeed'
        }, {
            title: 'Search',
            action: 'search'
        }, {
            title: 'Newsmaker Interviews',
            subcategory: new Utils.categoryCollection(interviews),
            action: 'subcategory'

        }, {
            title: 'Finance',
            subcategory: new Utils.categoryCollection(financeSubs),
            action: 'subcategory'
        }, {
            title: 'Special Programming',
            subcategory: new Utils.categoryCollection(specialsubs),
            action: 'subcategory'

        }, {
            title: 'Health',
            subcategory: new Utils.categoryCollection(healthSubs),
            action: 'subcategory'
        }
    ]);

    return categories;

})