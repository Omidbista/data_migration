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


    def import_fields(self):
        file_content = base64.b64decode(self.file_data)
        file_content_string = file_content.decode('utf-8')
        csv_file = StringIO(file_content_string)
        reader = csv.DictReader(csv_file)
        self.field_ids.unlink()
        header = next(reader)
        print("header====================",header)
        header_keys = [key.strip() for key in header.keys()]
        print("header key======================",header_keys)
        label_mapping = {
            'Item Master': 'product',
            'Location': 'location',
            'Available Quantity': 'quantity'
        }
        for original_key in header_keys:
            stripped_key = original_key.strip()
            print("strippedd====================key",stripped_key)
            label = label_mapping.get(stripped_key)
            print("label---------------",label)
            self.field_ids.create({
                'import_data_id': self.id,
                'name': original_key,
                'label' : label
            })
        return True

    def create_records(self):
        if not self.name:
            raise UserError("Please provide a table name.")
        labels = self.field_ids.mapped('label')
        file_content = base64.b64decode(self.file_data)
        file_content_string = file_content.decode('utf-8')
        csv_file = StringIO(file_content_string)
        reader = csv.reader([csv_file])

        return True

    def create_table(self):
        if not self.name:
            raise UserError("Please provide a table name.")
        labels = self.field_ids.mapped('label')

        # Create table
        table_query = f"CREATE TABLE IF NOT EXISTS {self.name} (id SERIAL PRIMARY KEY,"
        # table_query = f"CREATE TABLE IF NOT EXISTS {self.name}"

        for label in labels:
            if label:
                table_query += f"{label} VARCHAR,"
        table_query = table_query[:-1]  # Remove the last comma
        table_query += ");"

        # Execute the query
        self._cr.execute(table_query)
        self._cr.commit()
        #     next(reader)  # Skip the header
        file_content = base64.b64decode(self.file_data)
        file_content_string = file_content.decode('utf-8')
        csv_file = StringIO(file_content_string)
        reader = csv.DictReader(csv_file)
        next(reader)
        for row in reader:
            values = []
            for label in labels:
                if label:
                    value = row[
                        labels.index(label)] if label in row else ''  # Get the value corresponding to the label
                    values.append(f"'{value}'")  # Enclose value in quotes
                else:
                    values.append('NULL')  # Use NULL for empty labels

            values_str = ', '.join(values)
            update_query = f"UPDATE {self.name} SET {', '.join([f'{labels[i]} = {values[i]}' for i in range(len(labels))])};"
            self._cr.execute(update_query)
        self._cr.commit()
        return True


    def create_list_view(self):
        return

    def access_right(self):
        return

    def view_records(self):
        return


class ImportDataFields(models.Model):
    _name = "import.data.fields"
    _description = "Import Data Fields"

    name = fields.Char(string="Name")
    label = fields.Char(string="Label")
    type = fields.Selection([('char', 'Char')], default="char", string='Type')
    import_data_id = fields.Many2one('import.data')




