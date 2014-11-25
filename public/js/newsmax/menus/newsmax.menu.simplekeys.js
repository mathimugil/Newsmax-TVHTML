define(['navigation', 'hbs!newsmax/templates/KeyBoard','underscore'], function(Navigation, KeyboardTemplate,_) {
    return Navigation.Menu.extend({
        _coords: {
            row: 0,
            col: 0
        },

        events: {
            'mouseover td':'setMouseFocus','click td':'_onselect'
        },
        setMouseFocus: function(e) {
            var t =  $(e.currentTarget);
            this._coords.col = t.index();
            this._coords.row = t.parent('tr').index();
            this.setFocus();
        },

        initialize: function() {
            Navigation.Menu.prototype.initialize.call(this);
            this.on('onfocus', this._onFocus, this);
            this.on('onblur', this._onBlur, this)
            this.on('onright', this._columnUp, this);
            this.on('onleft', this._columnDown, this);
            this.on('onup', this._rowUp, this);
            this.on('onselect', this._onselect, this);
            this.on('ondown', this._rowDown, this);
        },
        _onselect: function() {
            this.trigger('valueselect', this.getValue());
        },
        _onFocus: function() {
            this.setFocus();
        },

        _onBlur: function() {
            $(this.el).find("td").removeClass("focused")
        },

        getValue: function() {
            var item = $(this.el).find("tr").eq(this._coords.row).find('td').eq(this._coords.col);
            return _.isString(item.attr('data-value')) ? item.attr('data-value') : item.text();
        },
        setFocus: function() {
            var that = this;

            if(window._keyboard_timer)
                clearTimeout(window._keyboard_timer);
            
            window._keyboard_timer = setTimeout(function() {
                var find_item = $(that.el).find("tr").eq(that._coords.row).find('td').eq(that._coords.col);
                //$(that.el).find("td").removeClass("focused")
                var focused_item = that.el.getElementsByClassName('focused');
                if(focused_item.length > 0)
                    focused_item[0].className = "";

                find_item.addClass("focused");

                //TODO: remove later

                
                //$log(" SEARCH FOCUS: row " + that._coords.row + ", col: ", that._coords.col)

                if (that._oldIndex !== that._currentIndex && that._focused) {
                    $log('triggering new focus! IF!!!!!');
                    that.trigger('newfocus', {
                        index: that._currentIndex,
                        item: that.collection.at(that._currentIndex)
                    });
                    that._oldFocus = that._currentIndex;
                } else 
                {
                    //$log('triggering new focus! else!!!!!');
                    //this.trigger('newfocus', {
                    //    coords: this._coords,
                    //    value: find_item
                    //});
                }
            }, 1);
        },

        _testColUp: function(idx) {
            idx = _.isNumber(idx) ? idx : this._coords.col + 1;
            return ($(this.el).find("tr").eq(this._coords.row).find('td').length !== idx);
        },
        _columnUp: function() {
            if (this._testColUp()) {
               this._coords.col++;
               this.setFocus();
            }
        },

        _columnDown: function() {
            if (this._coords.col > 0 ) {
                this._coords.col--;
                this.setFocus();
            } else {
                this.trigger('leftfrommenu');
            }
        },
        _testRowDown: function(idx) {
            idx = _.isNumber(idx) ? idx : this._coords.row + 1;
            return ($(this.el).find("tr").length !== idx);
        },

        _rowUp: function() {
            if(this._coords.row > 0 ) {
                if(this._coords.row == $(this.el).find("tr").length - 1) {
                  //this design has some colspans in the last row. we have to deal with these differently
                  if ($(this.el).find("tr").eq(this._coords.row).hasClass("bottom-keyboard-buttons")){
                    switch (this._coords.col){
                      case 0: //clear
                        this._coords.col = 0; //move to 4
                        break; 
                      case 1: //del
                        this._coords.col = 2; //move to 6
                        break;
                      case 2: //space
                        this._coords.col = 3; //move to 7
                        break;
                      case 3: //ok
                        this._coords.col = 5; //move to 9
                        break;
                    }
                  }else{
                    this._coords.col = this._coords.col;
                  }
                    
                }
                this._coords.row--;
                this.setFocus();
            }
        },

        _rowDown: function() {
            if (this._testRowDown()) {
                this._coords.row++;
                if(this._coords.row == $(this.el).find("tr").length - 1) {
                  // we have to handle the last item in the row above the buttons differently
                  if (this._coords.col == 5 && this._coords.col == 5){
                    this._coords.col = 3;
                  } else {
                    switch(this._coords.col){
                        case 0: case 1:
                            this._coords.col = 0; break;
                        case 2: case 2:
                            this._coords.col = 1; break;
                        default:
                            this._coords.col = 2;
                    }
                  }
                }
                this.setFocus();
            }
        },

        render: function() {
            $(this.el).html(KeyboardTemplate({
                rows: _("abcdefghijklmnopqrstuvwxyz0123456789".match(/.{1,6}/g)).map(function(row) {
                    return row.split("");
                })
            }))
        }
    });

})