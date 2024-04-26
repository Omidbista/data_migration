odoo.define("database_migration.ImportListRenderer", function (require) {
    "use strict";

    let listRenderer = require('web.ListRenderer');

    return listRenderer.extend({
        className: 'o_import_list_view',

        init: function (parent, state, params) {
            this.model_list = {}
            this._super.apply(this, arguments);
        },

        _renderView: async function () {
            this.state.fieldsInfo.list = this.state.fieldsInfo.import_list_view
            return await this._super.apply(this, arguments)
        },

        _renderHeaderCell: function (node) {
            let th = this._super.apply(this, arguments)
            let config = $("<span class='fa fa-cog' />")
            let self = this;
            console.log("Node ", node)
            console.log("Config ", config)
            console.log("This ", this)
            th.append(config)
            config.on('click', function(event) {
                console.log(event)
                event.stopPropagation()
                event.preventDefault()
                self._rpc({
                    model: 'import.data',
                    method: 'open_field_wizard',
                    args: [self.state.model, self.field_type[node.attrs.name].id]
                }).then((result) => {
                    console.log("Action ", result)
                    self.do_action(result);
                });

            })
            return th

        },
        _renderBodyCell: function (record, node, colIndex, options) {
            let td = this._super.apply(this, arguments)
            if (options.mode === 'readonly') {
                let field = this.field_type[node.attrs.name]
                if (field) {
                    let value = record.data[field.field_name]
                    this.validate(td, field, value)
                }
            }
            return td
        },

        wizard: function (messages) {
            if (!Object.keys(messages).length) {
                return
            }
            let div = $("<div class='field_warning oe_read_only'/>")
            let icon = $("<span class='fa fa-exclamation-circle'/>")
            let table = $("<table class='table table-striped'/>")
            let header = "<tr><th>Type</th><th>Description</th></tr>"
            table.append(header)
            div.append(icon, table)
            $.each(messages, function (key, value) {
                let row = $("<tr/>")
                row.append("<td>" + key + "</td>")
                row.append("<td>" + value + "</td>")
                table.append(row)
            })
            return div
        },
        validate: async function (element, field, value) {
            let messages = {}
            console.log("Checking Field ", field.field_name, ' type ', field.type, ' value ', value)
            if (value) {
                if (field.type === 'integer') {
                    if (!this.validInteger(value)) {
                        messages['Invalid Type'] = 'Required Integer'
                    }
                } else if (field.type === 'boolean') {
                    if (!this.validBoolean(value)) {
                        messages['Invalid Type'] = 'Required Boolean'
                    }
                } else if (field.type === 'date') {
                    let pattern = field.date_format
                    if (!pattern) {
                        messages['Date Format'] = "Date format is not defined"
                    }
                    if (!this.validDate(value, pattern)) {
                        messages['Invalid Format'] = "Date format is not valid"
                    }
                } else if (field.type === 'datetime') {
                    messages['Not Supported'] = 'Datetime value is not supported'
                } else if (field.type === 'float') {
                    if (!this.validFloat(value)) {
                        messages['Invalid Format'] = "Require a float value"
                    }
                } else if (field.type === 'many2many' || field.type === 'many2one') {
                    if (!field.rel_model_name) {
                        messages['Missing Relation'] = "Assign model to the field"
                    } else if (!field.rel_field_name) {
                        messages['Missing Relation'] = "Assign Rel Field the field"
                    } else {
                        let missing_values = await this.validMany2many(field, value)
                        if (missing_values.length) {
                            messages['Missing Values'] = missing_values
                        }
                    }
                } else if (field.type === 'selection') {
                    if (!this.validSelection(field, value)) {
                        messages['Invalid Value'] = "Value is not a valid selection"
                    }
                }
            }

            if (field.required && !value) {
                messages['Value'] = 'Field is required'
            }

            let wizard = this.wizard(messages)
            if (wizard) {
                element.prepend(wizard)
            }
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
                missing_values = values_to_check.filter(value => !odoo_values.includes(value))
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
