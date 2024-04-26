from odoo import models, fields, api
from odoo.exceptions import UserError


class ActWindowView(models.Model):
    _inherit = "ir.actions.act_window.view"

    view_mode = fields.Selection(selection_add=[('import_view', 'Import View')], default="tree",
                                 ondelete={'import_view': 'set default'})
