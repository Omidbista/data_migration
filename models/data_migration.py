# -*- coding: utf-8 -*-


from odoo import models, fields


class DataMigration(models.Model):
    _name = 'data.migration'
    _description = 'Data Migration'

    name = fields.Char()
    file = fields.Binary()
    header_ids = fields.One2many("migration.header", 'data_migration_id')


    # Step 1
    def get_header(self):
        return

    # Step 2
    def create_table(self):
        # create table name
        # data.migration.001
        # id, product, location, quantity
        return

    # Step 3
    def import_data(self):
        return


    # Step 4
    def create_list_view(self):
        # ir.ui.view view for data.migration.001
        # fields product, location, quantity
        return


    # Step 5
    def add_security_rule(self):
        # access for table data.migration.001 for base.group_user
        return



    def view_data(self):
        return {
            'name': 'Product Data',
            'type': 'ir.actions.act_window',
            'res_model': self.name,
            'view_mode': 'tree',
            'domain': []
        }