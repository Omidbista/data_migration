odoo.define("database_migration.ImportModel", function (require) {
    "use strict";

    let BasicModel = require('web.BasicModel');

    return BasicModel.extend({
        async load(params) {
            return this._super.apply(this, arguments)
        },
        async _makeDefaultRecord(modelName, params) {
            params.viewType = 'import_view'
            return await this._super.apply(this, arguments)
        },

        call: function () {
            let result = this._super.apply(this, arguments);
            return result
        },
        set: function () {
            let result = this._super.apply(this, arguments);
            return result
        },
        get: function () {
            let result = this._super.apply(this, arguments);
            return result
        },
        _fetchSpecialData: async function (record, options) {
            if (options && options.viewType !== 'import_view') {
                options.viewType = 'import_view'
            }
            return await this._super.apply(this, arguments);
        },

    });
})