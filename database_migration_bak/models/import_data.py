from odoo import models, fields, api
from io import StringIO
import csv
import base64
from odoo.exceptions import UserError


class ImportData(models.Model):
    _name = 'import.data'
    _description = 'Data Import'

    name = fields.Char(string="Table Name")
    source = fields.Selection([('csv', 'CSV')], default="csv", string='source')
    file_data = fields.Binary('File')
    file_name = fields.Char('File Name')
    field_ids = fields.One2many('import.data.fields' ,'import_data_id')
    model_id = fields.Many2one('ir.model')
    view_id = fields.Many2one('ir.ui.view')
    record_count = fields.Integer(string="Count")
    access_id = fields.Many2one("ir.model.access")

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
        return True

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
        create_records = self.env[self._get_table_name()].create(vals_list)
        self.record_count = len(create_records)
        return create_records

    def create_table(self):
        if not self.name:
            raise UserError("Please provide a table name.")

        if self.model_id:
            raise UserError("Model is already created")

        field_ids = [[0,0,{'name': self._get_field_name(line), 'field_description': self._get_field_name(line), 'ttype': 'char'}]
                     for line in self.field_ids]

        model = self.env['ir.model'].create({
            'name': self.name,
            'model': self._get_table_name(),
            'state': 'manual',
            'field_id': field_ids
        })
        self.model_id = model.id
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
                <tree editable='bottom'>
                    {''.join(fields_list)}
                </tree>
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
            'view_type': 'tree',
            'view_mode': 'tree',
            'view_id': self.view_id.id,
            'target': 'current',
            'domain': [],
            'context': {}
        }




