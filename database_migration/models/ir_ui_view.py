from odoo import models, fields, api
from odoo.exceptions import UserError


class View(models.Model):
    _inherit = "ir.ui.view"

    type = fields.Selection(selection_add=[('import_list_view', 'Import List View')], default="tree",
                            ondelete={'import_list_view': 'set default'})
