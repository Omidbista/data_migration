odoo.define("database_migration.ImportListController", function (require) {
    "use strict";

    let listController = require('web.ListController');

    return listController.extend({
        init(parent, model, renderer, params) {
            this._super.apply(this, arguments);
            this.model = model
            this.model_list = {}
            this.error_ids = {}
            this.field_type = this.model.field_type
            this.error_types = this.model.error_types
            this.data = {}
        },
        async willStart() {
            const res = await this._super(...arguments);
            this.renderer.controller = this;
            return res
        },

        // _saveRecord: function (recordId) {
        //     var record = this.model.get(recordId, {raw: true});
        //     this.update_data_status(record)
        //     return this._super.apply(this, arguments);
        // },

        async on_attach_callback() {
            this._super()
            this.update_data_status()
            this.progress = $("<div class='oe_progress'/>")
            this.progress_percentage = $("<span/>")
            this.progress.append(this.progress_percentage)
            this.renderer.$el.prepend(this.progress)

        },

        update_data_status: async function (record_data) {
            let self = this;
            let model_errors = {}
            let data = []
            if (record_data) {
                data = [record_data.data]
            } else {
                data = await this._rpc({
                    'model': this.modelName,
                    'method': 'search_read',
                    'fields': Object.keys(this.field_type)
                })
            }

            let counter = 1;
            for (const record of data) {
                let {field_errors, record_errors} = await self.get_error_ids(record)
                self.error_ids[record.id] = field_errors
                self.data[record.id] = record
                model_errors[record.id] = record_errors
                self.setProgress((counter * 100) / data.length)
                counter++;
            }

            this._rpc({
                'model': 'import.data',
                'method': 'update_error_status',
                'args': [this.modelName, model_errors]
            }).then(function() {
                self.setProgress(0)
            })
        },


        setProgress(percentage) {
            this.progress.css("width", percentage + "%")
            this.progress_percentage.text(Math.round(percentage,0) + "%")
        },
        get_error_ids: async function (record) {
            let self = this;
            let error_ids = {};
            let record_errors = []
            for (const field_name of Object.keys(record)) {
                let value = record[field_name];
                let field = self.field_type[field_name];
                let errors = await self.validate(field, value)
                if (Object.keys(errors).length) {
                    error_ids[field_name] = errors
                    console.log("adding error ", errors)
                    record_errors.push(...Object.keys(errors))
                }
            }
            return {'field_errors': error_ids, 'record_errors': record_errors};
        },

        validate: async function (field, value) {
            let self = this;
            const error_ids = {};

            if (!field) {
                return error_ids;  // If no field is provided, return empty errors
            }

            // Define error types
            const {format: error_format, required: error_required, relation: error_relation} = self.error_types;

            let error_type = null;
            let error_message = null;

            // Check for field type and validate accordingly
            if (value) {
                if (field.type === 'integer' && !self.validInteger(value)) {
                    error_message = 'Required Integer';
                    error_type = error_format;
                } else if (field.type === 'boolean' && !self.validBoolean(value)) {
                    error_message = 'Required Boolean';
                    error_type = error_format;
                } else if (field.type === 'date') {
                    const pattern = field.date_format;
                    if (!pattern || !self.validDate(value, pattern)) {
                        error_message = !pattern ? 'Date format is not defined' : 'Date format is not valid';
                        error_type = error_format;
                    }
                } else if (field.type === 'datetime') {
                    error_message = 'Datetime value is not supported';
                    error_type = error_format;
                } else if (field.type === 'float' && !self.validFloat(value)) {
                    error_message = 'Require a float value';
                    error_type = error_format;
                } else if (field.type === 'many2many' || field.type === 'many2one') {
                    if (!field.rel_model_name || !field.rel_field_name) {
                        error_message = !field.rel_model_name
                            ? 'Assign model to the field'
                            : 'Assign Rel Field to the field';
                        error_type = error_relation;
                    } else {
                        const missing_values = await self.validMany2many(field, value);  // Await the asynchronous call
                        if (missing_values.length > 0) {
                            error_message = `Missing values: ${missing_values.join(', ')}`;
                            error_type = error_relation;
                        }

                    }
                } else if (field.type === 'selection' && !self.validSelection(field, value)) {
                    error_message = 'Value is not a valid selection';
                    error_type = error_format;
                }
            }

            // If there's an error, add it to the error_ids
            if (error_type && error_message) {
                error_ids[error_type.id] = {name: error_type.name, message: error_message};
            }

            // If the field is required and there's no value, add a required error
            if (field.required && !value) {
                error_ids[error_required.id] = {
                    name: error_required.name,
                    message: error_required.message,
                };
            }
            return error_ids
        },

        validSelection(field, value) {
            if (!field.selection_options) {
                return null;
            }
            if (!field.selection_options.split(",").includes(value)) {
                return null;
            }
            return true;
        },

        validMany2many: async function (field, value) {
            if (!value) {
                return true;
            }
            if (!this.model_list[field.rel_model_name]) {
                this.model_list[field.rel_model_name] = {}
            }
            if (!this.model_list[field.rel_model_name][field.rel_field_name]) {
                this.model_list[field.rel_model_name][field.rel_field_name] = []
            }

            let values_to_check = []
            let missing_values = []

            if (field.type === 'many2many') {
                let values = value.split(",")
                values_to_check = values.filter(value =>
                    !this.model_list[field.rel_model_name][field.rel_field_name].includes(value))
            } else {
                if (!this.model_list[field.rel_model_name][field.rel_field_name].includes(value)) {
                    values_to_check.push(value)
                }
            }

            if (values_to_check.length) {
                let odoo_data = await this._rpc({
                    'model': field.rel_model_name,
                    'method': 'search_read',
                    'domain': [[field.rel_field_name, 'in', values_to_check]],
                    'fields': [field.rel_field_name]
                })
                let odoo_values = odoo_data.map((record) => record[field.rel_field_name])
                this.model_list[field.rel_model_name][field.rel_field_name].push(...odoo_values)
                return values_to_check.filter(value => !odoo_values.includes(value))
            }
            return missing_values

        },

        validBoolean: function (value) {
            if (['true', '1', 'yes', 'y', 'on', 'false', '0', 'no', 'n', 'off'].includes(value)) {
                return true;
            }
            return null;

        },

        validFloat: function (value) {
            let sanitized = parseFloat(value)
            let reg = /^-?\d*\.?\d+$/;
            if (isNaN(sanitized) || !reg.test(value)) {
                return null;
            }
            return true;
        },

        validInteger: function (value) {
            let sanitized = parseInt(value, 10)
            if (isNaN(sanitized)) {
                return null;
            }
            return true;
        },

        validDate: function (dateStr, pattern) {
            const datePatterns = {
                'dd/MM/yyyy': /^(\d{2})\/(\d{2})\/(\d{4})$/,
                'MM/dd/yyyy': /^(\d{2})\/(\d{2})\/(\d{4})$/,
                'yyyy-MM-dd': /^(\d{4})-(\d{2})-(\d{2})$/,
                'dd-MM-yyyy': /^(\d{2})-(\d{2})-(\d{4})$/,
                'MM-dd-yyyy': /^(\d{2})-(\d{2})-(\d{4})$/,
                'yyyy/MM/dd': /^(\d{4})\/(\d{2})\/(\d{2})$/, // You can add more patterns as needed
            };

            let regex = datePatterns[pattern]

            if (!regex) {
                return null;
            }

            const match = dateStr.match(regex);

            if (match) {
                // Parse using new Date() with indices from regex
                let parsedDate;
                switch (pattern) {
                    case 'dd/MM/yyyy':
                    case 'dd-MM-yyyy':
                    case 'dd.MM.yyyy':
                        parsedDate = new Date(`${match[3]}-${match[2]}-${match[1]}`); // Year-Month-Day
                        break;
                    case 'MM/dd/yyyy':
                    case 'MM-dd-yyyy':
                    case 'MM.dd.yyyy':
                        parsedDate = new Date(`${match[3]}-${match[1]}-${match[2]}`); // Year-Month-Day
                        break;
                    case 'yyyy-MM-dd':
                    case 'yyyy/MM/dd':
                        parsedDate = new Date(`${match[1]}-${match[2]}-${match[3]}`); // Year-Month-Day
                        break;
                    default:
                        parsedDate = null;
                }

                if (parsedDate && !isNaN(parsedDate.getTime())) {
                    return true
                }
            }

            return null;
        }
    });


})