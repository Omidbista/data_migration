from odoo import models, fields, api
from odoo.exceptions import UserError


class ActWindowView(models.Model):
    _inherit = "ir.actions.act_window.view"

    view_mode = fields.Selection(selection_add=[('import_list_view', 'Import List View')], default="tree",
                                 ondelete={'import_list_view': 'set default'})
