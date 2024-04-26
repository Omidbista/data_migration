odoo.define("database_migration.ImportListModel", async function (require) {
    "use strict";

    let ListModel = require('web.ListModel');


    return ListModel.extend({
        init: function (parent, params) {
            console.log("Model ", this)
            console.log("Model parent ", parent)
            console.log("Model Params ", params)
            this.modelName = params.modelName
            this._super.apply(this, arguments)
        },

        __load: async function () {
            console.log("Get is called")
            let res = await this._super.apply(this, arguments)
            let model_name = this.modelName
            console.log("model name ", model_name)
            let field_list = await this._rpc({
                model: "import.data.fields",
                method: 'search_read',
                fields: ['name', 'label', 'type', 'required', 'field_name',
                    'date_format', 'rel_model_name', 'rel_field_name',
                    'selection_options'],
                domain: [['import_data_id.model_id', '=', model_name]]
            })
            this.field_type = {}
            let self = this;
            field_list.forEach(function (field) {
                if (field.field_name) {
                    self.field_type[field.field_name] = field
                }
            })
            return res
        }
    });
})