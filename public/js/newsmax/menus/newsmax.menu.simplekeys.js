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
            // $log(" SET FOCUS ", this.options, this.coords())
            $(this.el).find("td").removeClass("focused")
            $(this.el).find("tr").eq(this._coords.row).find('td').eq(this._coords.col).addClass("focused");

            //TODO: remove later


            this.trigger('newfocus', {
                coords: this._coords,
                value: $(this.el).find("tr").eq(this._coords.row).find('td').eq(this._coords.col)
            });

            if (this._oldIndex !== this._currentIndex && this._focused) {
                this.trigger('newfocus', {
                    index: this._currentIndex,
                    item: this.collection.at(this._currentIndex)
                });
                this._oldFocus = this._currentIndex;
            }
        },

        _testColUp: function(idx) {
            idx = _.isNumber(idx) ? idx : this._coords.col + 1;
            return ($(this.el).find("tr").eq(this._coords.row).find('td').length !== idx);
        },
        _columnUp: function() {
            $log(" COLUMN UP !");
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
                    this._coords.col = this._coords.col * 2;
                }
                this._coords.row--;
                this.setFocus();
            }
        },

        _rowDown: function() {
            if (this._testRowDown()) {
                this._coords.row++;
                if(this._coords.row == $(this.el).find("tr").length - 1) {
                    switch(this._coords.col){
                        case 0: case 1:
                            this._coords.col = 0; break;
                        case 2: case 2:
                            this._coords.col = 1; break;
                        default:
                            this._coords.col = 2;
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