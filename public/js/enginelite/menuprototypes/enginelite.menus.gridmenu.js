define(['navigation','underscore', 'hbs!enginelite/menuprototypes/templates/enginelite.gridmenu', 'enginelite/menuprototypes/helpers/handlebars.helpers.pager'], function(Navigation, _, GridMenuPageTemplate) {
/*

  Basic Paging Grid Menu

  Paging Grid Menu, alows for pages of grids of varying sizes,
  By Default this will look for html in the following structure
  <ul> <-- 1st Page of Items
    <li></li> <!-- first item of first page
    ...
    <li></li> <-- Last item of first page
  </ul>
  <ul> <-- 2nd Page of Items
    ...
  </ul>

  Note its a bit HTML agnostic so the following should also worl
  <div> <-- 1st Page of Items
    <p></p> <!-- first item of first page
    ...
    <p></p> <-- Last item of first page
  </ul>


  General Instatiation :
    var GridMenu = GridMenuProto.extend({

    _defaults: {
      rows: 2, cols: 4 // Set your basic layout
    },

    initialize: function() {
       GridMenuProto.prototype.initialize.call(this);
       this.on('pageup', this.pageUp, this); // Bind to Page Up Handler
       this.on('pageodwn', this.pageDown, this); /// Bind to Page Down Handler
    },

    pageUp: function() {
        // Do page up.
    },
    pageDown: function() {
        // Do Page Down
    },
    render: function() {
        // Do Render
    }
  });


  There's a few special events. When something new gets focused a "newfocus" event
  will occur with the current index and the current model from the collection passed as
  {
    index: [[ index ]], item: this.collection.at([[ index]])
  }

  Some boundry events "upfromtop" is up from the top row, and "downfrombottom", is down
  from the bottom row.
 */

  var GridMenu = Navigation.Menu.extend({

    _currentIndex : 0,
    _defaults: {
      rows: 4, cols: 2, _onPlay:false
    },


    events : {
      'mouseover .gridMenuPage:not(".currentRow")' : "showOverlays",
      /*'mouseover #gridMenuContainer' : 'focus',*/
      'mouseover .currentRow li' : 'focusOnElement',
      'click .currentRow li' : '_onSelect', 
    },

    initialize: function() {
      Navigation.Menu.prototype.initialize.call(this, arguments);
      this.options = _.defaults(this.options, this._defaults);
      this.options.perpage = this.options.cols * this.options.rows;
      this.on('onfocus', this._onFocus, this);
      this.on('onblur',this._onBlur, this);
      this.on('onright', this._columnUp, this);
      this.on('onleft', this._columnDown, this);
      this.on('onup', this._rowUp, this)
      this.on('ondown', this._rowDown, this)
      this.on('onselect', this._onSelect, this);
      this.on('pageup pagedown', this.showOrHideOverlays, this);
      this.on('onplay', function(){
        if(!this.options._onPlay) return;
        this._onSelect()
      });
    },

    focusOnElement: function(event){
      
      var idx = $(event.currentTarget).index();
      this._currentIndex = idx + $(event.currentTarget).parent().index()* this.options.cols;
      if(!this.focused)
        this.focus();
      else
        this.setFocus();
      $('.gridArrowOverlay').hide();
    },


    showOverlays: function(event){
      
      this.focus();
      if($(event.currentTarget).hasClass('currentRow'))
        return;

      if(this.showBottomOverlay())
        $('#gridBottomRowOverlay').show();
      if(this.showTopOverlay())
        $('#gridTopRowOverlay').show(); 

      $('.gridArrowOverlay').on('mouseleave',function(){
        $('.gridArrowOverlay').off('mouseleave');
        $('.gridArrowOverlay').hide();
      }); 

    },

    showOrHideOverlays: function(){
      if(this.showTopOverlay())
        $('#gridTopRowOverlay').show();
      else
        $('#gridTopRowOverlay').hide();

      if(this.showBottomOverlay())
        $("#gridBottomRowOverlay").show();
      else
        $("#gridBottomRowOverlay").hide(); 
    },

    showBottomOverlay: function(){
    
      var mod = this.collection.length % this.options.cols;
      var lastRowStartingIndex = this.collection.length - this.options.cols + mod;  //TODO: double check this
      if(this._currentIndex >= lastRowStartingIndex)
        return false
      else 
        return true
    },

    showTopOverlay: function(){
      if(this._currentIndex < this.options.cols)
        return false;
      else 
        return true;
    },

    coords: function(index) {
        index = index || this._currentIndex;
        var pi = Math.floor(index/this.options.perpage), mpi = Math.ceil( this.collection.length / (this.options.rows * this.options.cols)) - 1;
        return {
          pageIndex: pi,
          lastPageIndex: ((pi * this.options.perpage) + this.options.perpage) - 1 ,
          x: index % this.options.cols,
          y: index % this.options.rows,
          valid: (index < this.collection.length),
          maxPageIndex: mpi,
          lastpage: (pi === mpi)
        }
    },

    _onFocus: function() {
        this.setFocus();
    },

    _onBlur: function(){
      $(this.options.el).find('li').removeClass('focused');
    },

    _oldIndex: null,
    _oldFocus:null,

    setFocus: function() {
      this.trigger('blurfocus', this.collection.at(this._oldFocus));
      $(this.options.el).children().children().removeClass("focused")
      $(this.options.el).children().children().eq(this._currentIndex).addClass("focused");
      if(this._oldIndex !== this._currentIndex && this.focused) {
        this.trigger('newfocus', this.collection.at(this._currentIndex));
        this._oldFocus = this._currentIndex;
      }
    },

    _onSelect:function(){
      this.trigger('selecteditem',this.collection.at(this._currentIndex));
    },

    _pageUp:function() {
      if (this.coords().lastpage) {
        this.trigger("rightedge");
        return;
      }
      var gap = this.options.perpage - this.options.cols + 1;
      var desiredIndex = this._currentIndex + gap;
      while (desiredIndex >= this.collection.length && desiredIndex > this._currentIndex) {
        desiredIndex -= this.options.cols
      }
      this._currentIndex = desiredIndex;
      this.trigger("pageup", this.coords().pageIndex, this.coords().lastpage);
      this.setFocus();
    },
    _pageDown: function() {
      var coords = this.coords();
      if(coords.pageIndex === 0) {
        this.trigger("leftedge");
        $log('leftedge')
        return;
      }
      var gap = this.options.perpage - this.options.cols + 1;
      this._currentIndex -= gap;
      this.trigger('pagedown',this.coords().pageIndex, this.coords().lastpage);
      this.setFocus();
    },

    _columnUp: function() {
      if((this._currentIndex % this.options.cols) == (this.options.cols -1)) {
        this._pageUp();
      } else if (this._currentIndex < this.collection.length - 1) {
        this._currentIndex++;
        this.setFocus();
      }
    },

    _columnDown: function() {
      if((this._currentIndex % this.options.cols) !== 0 ) {
        this._currentIndex--;
        this.setFocus();
      } else {
        this._pageDown();
      }
    },

    _rowUp: function() {
      var _coords = this.coords();
      if((this._currentIndex > (_coords.pageIndex*this.options.perpage)&&this._currentIndex>=(_coords.pageIndex*this.options.perpage)+this.options.cols)) {
        this._currentIndex -= this.options.cols;
        this.setFocus();
      } else {
        this.trigger("upfromtop")
      }
    },

    _rowDown: function() {
      var coords = this.coords();
      if((this._currentIndex + this.options.cols ) <= coords.lastPageIndex  && this._currentIndex + this.options.cols < (this.collection.length)) {
          this._currentIndex += this.options.cols;
          this.setFocus();
       } else {
        this.trigger("downfrombottom");
       }
    },

    render: function () {
      var tmpl = (this.options.template) ? this.options.template : GridMenuPageTemplate;
      $(this.options.el).html(tmpl({
        items: this.collection.models.map(function(m) { return m.attributes }),
        numberPerPage: this.options.rows * this.options.cols
      }));
      this.trigger('pageset', this.coords().pageIndex);
      return this;
    }
  });

  return GridMenu;

});