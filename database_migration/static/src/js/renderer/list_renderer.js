odoo.define("database_migration.ImportListRenderer", function (require) {
    "use strict";

    let listRenderer = require('web.ListRenderer');

    return listRenderer.extend({
        className: 'o_import_list_view',

        init: function (parent, state, params) {
            this._super.apply(this, arguments);
        },

        _shouldRenderOptionalColumnsDropdown: function () {
            return false;
        },

        _renderView: async function () {
            this.state.fieldsInfo.list = this.state.fieldsInfo.import_list_view
            let res = this._super.apply(this, arguments)
            return res
        },



        _renderHeaderCell: function (node) {
            let th = this._super.apply(this, arguments)
            let config = $("<span class='fa fa-cog' />")
            let self = this;
            th.append(config)
            config.on('click', function (event) {
                event.stopPropagation()
                event.preventDefault()
                self._rpc({
                    model: 'import.data',
                    method: 'open_field_wizard',
                    args: [self.state.model, self.controller.field_type[node.attrs.name].id]
                }).then((result) => {
                    self.do_action(result);
                });

            })
            return th
        },
        _renderRow: function (record) {
            return this._super.apply(this, arguments)
        },
        _renderBodyCell: function (record, node, colIndex, options) {
            let self = this;
            let td = self._super.apply(self, arguments)
            if (options.mode === 'readonly') {
                let field_name = node.attrs.name
                let current_value = record.data[field_name]
                 let field = self.controller.field_type[field_name]
                    self.controller.validate(field, current_value).then(function (error_ids){
                        td.prepend(self.wizard(error_ids))
                    })
            }
            return td
        },


        wizard: function (messages) {
            if (!messages || !Object.keys(messages).length) {
                return
            }
            let div = $("<div class='field_warning oe_read_only'/>")
            let icon = $("<span class='fa fa-exclamation-circle'/>")
            let table = $("<table class='table table-striped'/>")
            let header = "<tr><th>Type</th><th>Description</th></tr>"
            table.append(header)
            div.append(icon, table)
            $.each(messages, function (key, value) {
                let row = $("<tr/>")
                row.append("<td>" + value.name + "</td>")
                row.append("<td>" + value.message + "</td>")
                table.append(row)
            })
            return div
        },

    });
})
