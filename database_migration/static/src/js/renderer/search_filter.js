/** @odoo-module **/

import {patch} from 'web.utils';
const FilterMenu = require('web.FilterMenu');



patch(FilterMenu.prototype, 'database_migration.import_list_filter', {
    setup() {
        let view_mode = this.env.action.view_mode
        if (view_mode === 'import_list_view'){
            delete this.props.fields.x_active;
        }
        this._super.apply(this, arguments)

        }

});
