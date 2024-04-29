from odoo import models, fields, api


class Error(models.Model):
    _name = 'import.error'
    _description = 'Import Error'

    name = fields.Char(string="Type", required=True)
    code = fields.Char(required=True)
    description = fields.Char(string="Description")
