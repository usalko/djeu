from django import forms
from django.conf import settings
from .date_picker_input import DatePickerInput


class PartialDatePickerInput(DatePickerInput):


    def get_context(self, name, value, attrs):
        context = super(PartialDatePickerInput, self).get_context(name, value, attrs)
        #  Override string value
        context['widget']['value'] = value if isinstance(value, str) else context['widget']['value']
        return context

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
