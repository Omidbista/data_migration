/** @odoo-module */

import { registry } from '@web/core/registry';
import { listView } from '@web/views/list/list_view';
import { ListController } from '@web/views/list/list_controller';

console.log("Class is loaded")
export class ImportListController extends ListController {
    setup() {
        super.setup();
    }

    async openRecord(record) {
        this.actionService.doAction({
            name: this.env._t('Import View'),
            type: 'ir.actions.act_window',
            res_id: record.resId,
            res_model: record.resModel,
            views: [[false, "import_view"]],
            view_mode: "import_view",
            target: 'current',
            context: {
                'res_id': record.resId
            }
        });
    }

}

registry.category('views').add('import_list_view', {
    ...listView,
    Controller: ImportListController,
});
