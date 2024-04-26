odoo.define("database_migration.ImportRenderer", function (require) {
    "use strict";

    let formRenderer = require('web.FormRenderer');


    return formRenderer.extend({
        className: 'o_import_view',
        custom_events: _.extend({}, formRenderer.prototype.custom_events, {
        }),

        willStart: async function (){
             let result = await this._super.apply(this, arguments);
             console.log("Form Will start ")

        },
        on_attach_callback: async function () {
            await this._super.apply(this, arguments);
            console.log("Form Attached callback ", this)
             $(".o_control_panel").hide()
        },


        _render_edit: function () {
             let result = this._super.apply(this, arguments);
            console.log("Form Render _render_edit ", result, this)
            return result

        },

        confirmChange: async function () {
            let result = await this._super.apply(this, arguments)
            console.log("Form Render confirmChange " , result, this)
            return result

        },

        // When view mode is changed
        updateState: async function (state, params) {
              let result = await this._super.apply(this, arguments)
            console.log("Form Render updateState ", state, params)
            return result
        },
    });
})