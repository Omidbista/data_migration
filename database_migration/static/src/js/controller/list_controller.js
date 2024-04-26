
odoo.define("database_migration.ImportListController", function (require) {
    "use strict";

    let listController = require('web.ListController');

    return listController.extend({
        init (parent, model, renderer, params) {
            this._super.apply(this, arguments);
            this.field_type = model.field_type

        },
    async willStart() {
        const res = await this._super(...arguments);
        this.renderer.field_type = this.field_type
        return res
    },

    });


})