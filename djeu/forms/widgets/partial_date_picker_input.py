from django import forms
from django.conf import settings
from django.shortcuts import render

from .date_picker_input import DatePickerInput


class PartialDatePickerInput(DatePickerInput):

    def get_context(self, name, value, attrs):
        context = super(PartialDatePickerInput,
                        self).get_context(name, value, attrs)
        #  Override string value
        context['widget']['value'] = value if isinstance(
            value, str) else context['widget']['value']
        return context

    @staticmethod
    def prepare_value(value) -> str:
        date = value.split('-')
        year = date[0] if len(date) > 0 else '____'
        month = date[1] if len(date) > 1 else '__'
        day = date[2] if len(date) > 2 else '__'
        return f'{day}.{month}.{year}'

    def render(self, name, value, attrs=None, renderer=None):
        """Render the widget as an HTML string."""
        if hasattr(self, 'read_only') and self.read_only:
            if not value:
                return '-'
            return self.prepare_value(value)
        return super(PartialDatePickerInput, self).render(name, value, attrs=attrs, renderer=renderer)

    @property
    def media(self):
        extra = '' if settings.DEBUG else '.min'
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
