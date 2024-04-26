from odoo import models, fields, api
from io import StringIO
import csv
import base64
from odoo.exceptions import UserError


class ImportData(models.Model):
    _name = 'import.data'
    _description = 'Data Import'

    name = fields.Char(string="Table Name", required=True)
    source = fields.Selection([('csv', 'CSV')], default="csv", string='Data Source', required=True)
    file_data = fields.Binary('File')
    file_name = fields.Char('File Name')
    field_ids = fields.One2many('import.data.fields' ,'import_data_id')
    model_id = fields.Many2one('ir.model')
    view_id = fields.Many2one('ir.ui.view')
    record_count = fields.Integer(string="Count")
    access_id = fields.Many2one("ir.model.access")
    state = fields.Selection([('draft','Draft'), ('config_fields','Config Fields'), ('ready','Ready')], default="draft")

    def import_fields(self):
        file_content = base64.b64decode(self.file_data)
        file_content_string = file_content.decode('utf-8')
        csv_file = StringIO(file_content_string)
        reader = csv.DictReader(csv_file)
        self.field_ids.unlink()
        header = next(reader)
        header_keys = [key.strip() for key in header.keys()]
        for original_key in header_keys:
            self.field_ids.create({
                'import_data_id': self.id,
                'name': original_key,
            })
        self.state = 'config_fields'
        return True


    def validate(self):
        if not self.field_ids:
            raise UserError("At least one field is required.")
        if not self.name:
            raise UserError("Table name is required")

        self.create_table()
        self.access_right()
        self.create_list_view()
        self.create_records()
        self.state = 'ready'




    def create_records(self):
        if not self.name:
            raise UserError("Please provide a table name.")
        file_content = base64.b64decode(self.file_data)
        file_content_string = file_content.decode('utf-8')
        csv_file = StringIO(file_content_string)
        data = list(csv.DictReader(csv_file))
        data.pop(0)
        vals_list = []
        for values in data:
            vals = {}
            for field in self.field_ids:
                label = self._get_field_name(field)
                vals[label] = values[field.name]
            vals_list.append(vals)
        create_records = self.env[self._get_table_name()].sudo().create(vals_list)
        self.record_count = len(create_records)
        return create_records

    def create_table(self):
        if not self.name:
            raise UserError("Please provide a table name.")

        if self.model_id:
            raise UserError("Model is already created")

        self.model_id = self.env['ir.model'].create({
            'name': self.name,
            'model': self._get_table_name(),
            'state': 'manual',
        })

        for line in self.field_ids:
            field_id = self.env['ir.model.fields'].create({'name': self._get_field_name(line),
                                                        'field_description': self._get_field_name(line),
                                                        'ttype': 'char',
                                                        'model_id': self.model_id.id})
            line.field_id = field_id

        return True


    def _get_field_name(self, field):
        name = field.label or field.name
        name = name.replace(" ", "_").lower()
        return f"x_{name}"

    def _get_table_name(self):
        return f"x_{self.name.lower().replace(' ', '_')}"

    def create_list_view(self):
        fields_list = [f'<field name="{self._get_field_name(line)}"/>' for line in self.field_ids]
        view = self.env['ir.ui.view'].create({
            'model': self._get_table_name(),
            'name': f'{self.name} List View',
            'type': 'tree',
            'arch_base': f"""
                <import_list_view editable='bottom'>
                    {''.join(fields_list)}
                </import_list_view>
            """
        })

        self.view_id = view.id
        return view

    def access_right(self):
        if self.access_id:
            return
        access_right = self.env['ir.model.access'].create({
            'name': f"access_{self.name}",
            'model_id': self.model_id.id,
            'group_id': self.env.ref("base.group_user").id,
            'perm_read': 1,
            'perm_write': 1,
            'perm_create': 1,
            'perm_unlink': 1
        })
        self.access_id = access_right.id
        return access_right

    def view_records(self):
        return {
            'name': self.name,
            'res_model': self._get_table_name(),
            'type': 'ir.actions.act_window',
            'view_type': 'import_list_view',
            'view_mode': 'import_list_view',
            'view_id': self.view_id.id,
            'target': 'current',
            'domain': [],
            'context': {}
        }




    @api.model
    def open_field_wizard(self, model_name, field_id):
        model_id = self.env['ir.model'].search([('model','=',model_name)], limit=1)
        view_id = self.env.ref("database_migration.data_sanitizer_form").id
        print(field_id)

        print("model _id ", model_id)
        return {
            'name': "Data Sanitizer Wizard",
            'type': 'ir.actions.act_window',
            'res_model': 'data.sanitizer',
            'view_mode': 'form',
            'view_type': 'form',
            'views': [[view_id, "form"]],
            'target': 'new',
            'context': {'default_field_id': field_id, 'default_model_id': model_id.id}

        }



