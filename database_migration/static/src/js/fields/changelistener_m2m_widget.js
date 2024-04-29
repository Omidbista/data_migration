odoo.define('database_migration.changeListenerM2m', function (require) {
    "use strict";

    const fieldRegistry = require('web.field_registry');
    var FieldMany2ManyTags = require('web.relational_fields').FieldMany2ManyTags;
    let ListRenderer = require('database_migration.ImportListRenderer')


    let changeListenerM2M = FieldMany2ManyTags.extend({
        init: function () {
            this._super.apply(this, arguments);
        },

    });


    fieldRegistry.add('changeListenerM2M', changeListenerM2M);

    return {
        changeListenerM2M: changeListenerM2M,
    };
});
