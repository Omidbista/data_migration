odoo.define("database_migration.ImportView", function (require) {
    "use strict";

    let Controller = require("database_migration.ImportController")
    let Renderer = require("database_migration.ImportRenderer")
    let Model = require("database_migration.ImportModel")
    let FormView = require('web.FormView');
    let core = require('web.core');
    let _lt = core._lt;

    let ImportView = FormView.extend({
        config: _.extend({}, FormView.prototype.config, {
            Controller: Controller,
            Model: Model,
            Renderer: Renderer,
        }),
        icon: 'fa-th-large',
        viewType: "import_view",
        multi_record: false,
        create: true,
        withSearchBar: false,
        searchMenuTypes: [],
        display_name: _lt("ImportView"),

        init: function (viewInfo, params) {
            this._super.apply(this, arguments);
        },
    });

    let viewRegistry = require('web.view_registry');

    viewRegistry.add('import_view', ImportView);

    return ImportView;
})