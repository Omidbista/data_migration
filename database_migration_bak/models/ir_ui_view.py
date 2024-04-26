from odoo import models, fields, api
from odoo.exceptions import UserError


class View(models.Model):
    _inherit = "ir.ui.view"

    type = fields.Selection(selection_add=[('import_view', 'Import View')], default="tree",
                            ondelete={'import_view': 'set default'})
