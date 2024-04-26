
odoo.define("database_migration.ImportController", function (require) {
    "use strict";
    var framework = require('web.framework');
    let formController = require('web.FormController');

    return formController.extend({

        init: function (parent, model, renderer, params) {
            this._super.apply(this, arguments);
        },

        willStart: function() {
            let result = this._super.apply(this, arguments);
            return result
        },
        createRecord: async function(parentID, additionalContext) {
            const record = this.model.get(this.handle, {
                raw: true
            });
            const handle = await this.model.load({
                context: record.getContext({
                    additionalContext: additionalContext
                }),
                fields: record.fields,
                fieldsInfo: record.fieldsInfo,
                modelName: this.modelName,
                parentID: parentID,
                res_ids: record.res_ids,
                type: 'record',
                viewType: 'import_view',
            });

            console.log("Handle ", handle)
            this.handle = handle;
            this._updateControlPanel();
            return this._setMode('edit');
        },

        getSelectedIds: function() {
            var env = this.model.get(this.handle, {
                env: true
            });
            return env.currentId ? [env.currentId] : [];
        },

        start: function() {
            let result = this._super.apply(this, arguments);
            return result
        },

    });
})