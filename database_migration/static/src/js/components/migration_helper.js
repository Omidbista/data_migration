/** @odoo-module */

import { registry } from '@web/core/registry';
import { standardWidgetProps } from "@web/views/widgets/standard_widget_props";

const { Component, onWillStart, onWillUpdateProps} = owl;

export class MigrationHelper extends Component {
    setup() {
        super.setup();
        onWillStart(this.onWillStart);
        onWillUpdateProps(this.onWillUpdateProps)
    }
    async onWillUpdateProps() {
    }
    async onWillStart() {
        console.log("Will start Component")
    }
}
MigrationHelper.props = {
    ...standardWidgetProps,
};
MigrationHelper.template = 'database_migration.migration_helper';

registry.category("view_widgets").add("MigrationHelper", MigrationHelper);
