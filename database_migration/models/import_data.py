from odoo import models, fields, api, Command
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
    field_ids = fields.One2many('import.data.fields', 'import_data_id')
    model_id = fields.Many2one('ir.model')
    view_id = fields.Many2one('ir.ui.view')
    record_count = fields.Integer(string="Count", compute="compute_records")
    access_id = fields.Many2one("ir.model.access")
    state = fields.Selection([('draft', 'Draft'), ('config_fields', 'Config Fields'), ('ready', 'Ready')],
                             default="draft")

    def compute_records(self):
        for x in self:
            if x.model_id:
                x.record_count = self.env[x.model_id.model].search_count([])
            else:
                x.record_count = 0

    def import_fields(self):
        self.field_ids.unlink()

        file_content = base64.b64decode(self.file_data)
        file_content_string = file_content.decode('utf-8')
        csv_file = StringIO(file_content_string)
        reader = csv.DictReader(csv_file)
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
        """
            Create Table
            Create Columns
            Create Records
            Create Snapshot of the records
        """

        if not self.name:
            raise UserError("Please provide a table name.")

        file_content = base64.b64decode(self.file_data)
        file_content_string = file_content.decode('utf-8')
        csv_file = StringIO(file_content_string)
        data = list(csv.DictReader(csv_file))
        data.pop(0)  # Remove Header

        vals_list = []
        snapshot_list = []

        for values in data:
            vals = {'x_active': True}
            for field in self.field_ids:
                label = self._get_field_name(field)
                vals[label] = values[field.name]
            vals_list.append(vals)
            snapshot = vals.copy()
            snapshot['x_active'] = False
            snapshot_list.append(snapshot)

        model = self.env[self._get_table_name()].sudo()

        create_records = model.create(vals_list)
        snapshot_records = model.create(snapshot_list)
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
        ir_model_fields = self.env['ir.model.fields']
        self._create_default_fields(self.model_id.id)
        for line in self.field_ids:
            field_id = ir_model_fields.create({'name': self._get_field_name(line),
                                               'field_description': self._get_field_label(line),
                                               'ttype': 'char',
                                               'model_id': self.model_id.id})
            line.field_id = field_id

        return True


    def _create_default_fields(self, model_id):
        ir_model_fields = self.env['ir.model.fields']
        ir_model_fields.create({
            'name': 'x_active',
            'field_description': 'Active',
            'ttype': 'boolean',
            'model_id': model_id
        })

        ir_model_fields.create({
            'name': 'x_import_errors',
            'field_description': 'Error Type',
            'ttype': 'many2many',
            'model_id': model_id,
            'relation': 'import.error'

        })


    def _get_field_name(self, field):
        name = field.label or field.name
        name = name.replace(" ", "_").lower()
        return f"x_{name}"

    def _get_field_label(self, field):
        name = field.label or field.name
        name = name.replace("_", " ").title()
        return name


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
            'view_type': 'import_list_view,form',
            'view_mode': 'import_list_view',
            'views':[(self.view_id.id, 'import_list_view'), (False, 'form')] ,
            'target': 'current',
            'domain': [],
            'context': {}
        }

    @api.model
    def open_field_wizard(self, model_name, field_id):
        model_id = self.env['ir.model'].search([('model', '=', model_name)], limit=1)
        view_id = self.env.ref("database_migration.data_sanitizer_form").id
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

    @api.model
    def update_error_status(self, model_name, error_ids):
        records = self.env[model_name].search([('id','in', list(error_ids.keys()))])
        print("========================== ", records, error_ids)
        for record in records:
            record_errors = error_ids.get(str(record.id))
            print("updating ", record, "  with ", record_errors)
            record.write({'x_import_errors': [Command.set([int(line) for line in record_errors])]})
        return True


    def update_rec(self):
        self.update_error_status("x_product_data", {2: [2]})

    def reset(self):
        if self.model_id:
            queries = [
                f"DROP TABLE if EXISTS {self.model_id.model.replace('.', '_')}",
                f"delete from ir_model where id = '{self.model_id.id}'",
                f"delete from ir_model_fields where model_id = '{self.model_id.id}'",
            ]
            for query in queries:
                self.env.cr.execute(query)
            self.env.cr.commit()
        self.view_id.unlink()
        self.access_id.unlink()
        self.state = 'draft'

    def unlink(self):
        for x in self:
            x.reset()
        return super(ImportData, self).unlink()
