from odoo import models, fields, api
from io import StringIO
import csv
import base64
from odoo.exceptions import UserError
FIELD_TYPES = [('boolean', 'boolean'),
               ('char', 'char'),
               ('date', 'date'),
               ('datetime', 'datetime'),
               ('float', 'float'),
               ('integer', 'integer'),
               ('many2many', 'many2many'),
               ('many2one', 'many2one'),
               ('selection', 'selection'),
               ('text', 'text')]

class ImportDataFields(models.Model):
    _name = "import.data.fields"
    _description = "Import Data Fields"

    name = fields.Char(string="Name")
    label = fields.Char(string="Label")
    type = fields.Selection(FIELD_TYPES, default="char", string='Type')
    import_data_id = fields.Many2one('import.data')
    required = fields.Boolean()
    model_name = fields.Char(related="import_data_id.name", store=True)
    field_id = fields.Many2one('ir.model.fields', string='Field')
    field_name = fields.Char(related="field_id.name", store=True)
    date_format = fields.Selection([('dd/MM/yyyy', 'dd/MM/yyyy'),
                                    ('MM/dd/yyyy', 'MM/dd/yyyy'),
                                    ('yyyy-MM-dd', 'dd-MM-yyyy'),
                                    ('dd-MM-yyyy', 'dd-MM-yyyy'),
                                    ('MM-dd-yyyy', 'MM-dd-yyyy'),
                                    ('yyyy/MM/dd', 'yyyy/MM/dd'),
                                    ])
    rel_model = fields.Many2one('ir.model', string='Related Model')
    rel_field = fields.Many2one('ir.model.fields', string='Related Field')
    rel_model_name = fields.Char(related="rel_model.model", store=True)
    rel_field_name = fields.Char(related="rel_field.name", store=True)
    selection_options = fields.Char(compute="_get_selection_options", store=True)

    @api.depends("type", "rel_field")
    def _get_selection_options(self):
        for x in self:
            if x.type == 'selection':
                values = [option.value for option in x.rel_field.selection_ids] if x.rel_field else []
                x.selection_options = ",".join(values)

