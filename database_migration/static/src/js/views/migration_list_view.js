odoo.define("database_migration.ImportListView", function (require) {
    "use strict";

    let ListView = require('web.ListView')
    let ListModel = require('database_migration.ImportListModel')
    let ListRenderer = require('database_migration.ImportListRenderer')
    let ListController = require('database_migration.ImportListController')
    let viewRegistry = require('web.view_registry');

    let ImportView = ListView.extend({
        config: _.extend({}, ListView.prototype.config, {
            Controller: ListController,
            Model: ListModel,
            Renderer: ListRenderer,
        }),
        viewType: "import_list_view"

    });

    viewRegistry.add('import_list_view', ImportView);
    return ImportView;
})