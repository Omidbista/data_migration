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
        'views/import_view.xml',
        'views/import_data_view.xml'
    ],
    'demo': [
    ],
    'assets': {
        'web.assets_backend': [
            'database_migration/static/src/scss/*.scss',
            'database_migration/static/src/js/**/*.js',
        ],
        'web.assets_qweb': [
            'database_migration/static/xml/*.xml',
        ],
    },
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
