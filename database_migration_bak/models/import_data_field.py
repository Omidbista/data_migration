from odoo import models, fields, api
from io import StringIO
import csv
import base64
from odoo.exceptions import UserError
FIELD_TYPES = [(key, key) for key in sorted(fields.Field.by_type)]

class ImportDataFields(models.Model):
    _name = "import.data.fields"
    _description = "Import Data Fields"

    name = fields.Char(string="Name")
    label = fields.Char(string="Label")
    type = fields.Selection(FIELD_TYPES, default="char", string='Type')
    import_data_id = fields.Many2one('import.data')
    required = fields.Boolean()
    searchable = fields.Boolean()
    group_by = fields.Boolean()




