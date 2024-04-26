from odoo import models, fields, api
from io import StringIO
import csv
import base64
from odoo.exceptions import UserError


class DataSanitizer(models.TransientModel):
    _name = 'data.sanitizer'
    _description = 'Data Import Sanitizer'

    model_id = fields.Many2one('ir.model')
    field_id = fields.Many2one('ir.model.fields')
    strip = fields.Boolean()
    transform = fields.Selection([('lower','Lower Case'),
                                  ('upper','Upper Case'),
                                  ('title','Title'),
                                  ('sentence','Sentence')], string='Transform')
    mapping_ids = fields.One2many("sanitizer.mapping", "sanitizer_id")
    default_value = fields.Char()




class SanitizerMapping(models.TransientModel):
    _name = 'sanitizer.mapping'
    _description = 'Data Import Sanitizer Mapping'

    name = fields.Char(string="Value")
    value = fields.Char(string="Replace With")
    sanitizer_id = fields.Many2one('data.sanitizer')
