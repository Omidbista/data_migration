
odoo.define("database_migration.ImportListModel", async function (require) {
    "use strict";

    let ListModel = require('web.ListModel');


    return ListModel.extend({
        init: function (parent, params) {
            this.modelName = params.modelName
            this._super.apply(this, arguments)
        },

        __load: async function () {
            let res = await this._super.apply(this, arguments)
            await this.getFieldTypes();
            await this.getErrorType();
            return res
        },

        getFieldTypes: async function () {
           let model_name = this.modelName
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
        },
        getErrorType: async function () {
            let error_types = await this._rpc({
                model: "import.error",
                method: 'search_read',
                fields: ['code', 'name', 'description'],
            })
            this.error_types = {}
            let self = this;
            error_types.forEach(function (error) {
                if (error.code) {
                    self.error_types[error.code] = error
                }
            })
        }
    });
})