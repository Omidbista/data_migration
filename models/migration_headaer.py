# -*- coding: utf-8 -*-


from odoo import models, fields

class MigrationHeader(models.Model):
    _name = "migration.header"
    _description = "Migration Header"

    name = fields.Char()
    data_migration_id = fields.Many2one('data.migration')




