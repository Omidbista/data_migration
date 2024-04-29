# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name' : 'Bista Import Data',
    'version' : '16.0.0.0.1',
    'summary': '',
    'sequence': 10,
    'description': """
    """,
    'category': 'Import Data',
    'website': '',
    'depends': ['base', 'product', 'sale'],
    'data': [
        'security/ir.model.access.csv',
        'data/import_error.xml',
        'views/import_data.xml',
        'views/import_data_field.xml',
        'views/data_sanitizer.xml',
        'views/configuration.xml',
        'views/import_error.xml'
    ],
    'demo': [
    ],
    'assets': {
        'web.assets_backend': [
            'database_migration/static/src/scss/*.scss',
            'database_migration/static/src/js/**/*.js',
            'database_migration/static/xml/*.xml'

        ],
        'web.assets_qweb': [
            'database_migration/static/xml/*.xml',
        ],
    },
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
