from datetime import date
from django import forms
from django.conf import settings
from django.shortcuts import render

from .date_picker_input import DatePickerInput


class PartialDatePickerInput(DatePickerInput):
    
    def __init__(self, *args, use_admin_site_jquery=False, **kwargs):
        super(PartialDatePickerInput, self).__init__(*args, **kwargs)
        self.use_admin_site_jquery = use_admin_site_jquery

    def get_context(self, name, value, attrs):
        context = super(PartialDatePickerInput,
                        self).get_context(name, value, attrs)
        #  Override string value
        context['widget']['value'] = value if isinstance(
            value, str) else context['widget']['value']
        return context

    @staticmethod
    def prepare_value(value, default_value='-') -> str:
        if not value:
            return default_value
        if isinstance(value, date):
            value = value.isoformat()

        iso_value = value.split('-')
        year = iso_value[0] if len(iso_value) > 0 else '____'
        month = iso_value[1] if len(iso_value) > 1 else '__'
        day = iso_value[2] if len(iso_value) > 2 else '__'
        return f'{day}.{month}.{year}'

    @staticmethod
    def python_value(value) -> str:
        if value == '-' or not value:
            return ''
        date = value.split('.')
        day = date[0] if len(date) > 0 else '__'
        month = date[1] if len(date) > 1 else '__'
        year = date[2] if len(date) > 2 else '____'
        return f'{year}-{month}-{day}'

    def render(self, name, value, attrs=None, renderer=None):
        """Render the widget as an HTML string."""
        if hasattr(self, 'read_only') and self.read_only:
            return self.prepare_value(value)
        return super(PartialDatePickerInput, self).render(name, value, attrs=attrs, renderer=renderer)

    @property
    def media(self):
        extra = '' if settings.DEBUG else '.min'
        if self.use_admin_site_jquery:
            return forms.Media(
                js=(
                    'admin/js/vendor/jquery/jquery%s.js' % extra,
                    'jquery-ui/jquery-ui%s.js' % extra,
                    # 'djeu/js/jquery-datepicker.js',
                    'djeu/js/i18n/datepicker-ru-RU-partial.js',
                    'djeu/js/jquery-datepicker.init.js',
                ) + (
                    'admin/js/jquery.init.js',
                ),
                css={
                    'screen': (
                        'jquery-ui/jquery-ui.min.css',
                    ),
                },
            )
        else:
            return forms.Media(
                js=(
                    'jquery-ui/jquery-ui%s.js' % extra,
                    # 'djeu/js/jquery-datepicker.js',
                    'djeu/js/i18n/datepicker-ru-RU-partial.js',
                    'djeu/js/jquery-datepicker.init.js',
                ),
                css={
                    'screen': (
                        'jquery-ui/jquery-ui.min.css',
                    ),
                },
            )            
