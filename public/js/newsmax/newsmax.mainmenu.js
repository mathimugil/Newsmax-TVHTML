define(['backbone', 'underscore', 'newsmax/newsmax.utils'],function(Backbone, _, Utils) {
  var count = 0;


 

  

  var subcategorie1 = [{
    title: 'cat 1 subcategorie1',
    subsubcategory: Utils.createCollection('cat 1 subcategorie 1 item ')
  }, {
    title: 'cat 1 subcategorie2',
    subsubcategory: Utils.createCollection()
  }, {
    title: 'cat 1 subcategorie3',
    subsubcategory: Utils.createCollection()
  }];

  var subcategorie2 = [{
    title: 'cat 2 subcategorie1',
    subsubcategory: Utils.createCollection()
  }, {
    title: 'cat 2 subcategorie2',
    subsubcategory: Utils.createCollection()
  }, {
    title: 'cat 2 subcategorie3',
    subsubcategory: Utils.createCollection()
  }];

  var subcategorie3 = [{
    title: 'cat 3 subcategorie1',
    subsubcategory: Utils.createCollection()
  }, {
    title: 'cat 3 subcategorie2',
    subsubcategory: Utils.createCollection()
  }, {
    title: 'cat 3 subcategorie3',
    subsubcategory: Utils.createCollection()
  }];

  var categories = new Utils.categoryCollection([
    
    {
      title:'NewsMax Live',
      action: 'livefeed'
    },
    {
      title:'Search',
      action: 'search'
    },
    { 
      title: 'Newsmaker Interviews',
      action: 'interviews'
    },
    {
      title: 'category1',
      subcategory: new Utils.categoryCollection(subcategorie1),
      action: 'subcategory'
    }, {
      title: 'category2',
      subcategory: new Utils.categoryCollection(subcategorie2),
      action: 'subcategory'

    }, {
      title: 'category3',
      subcategory: new Utils.categoryCollection(subcategorie3),
      action: 'subcategory'
    }
  ]);

  return categories;

})