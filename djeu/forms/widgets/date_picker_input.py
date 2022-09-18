from django import forms
from django.conf import settings


class DatePickerInput(forms.TextInput):

    template_name = 'djeu/forms/widgets/date-picker-input.html'
    
    def __init__(self, *args, use_admin_site_jquery=False, **kwargs):
        super().__init__(*args, **kwargs)
        self.use_admin_site_jquery = use_admin_site_jquery

    def format_value(self, value):
        """File input never renders a value."""
        if self.is_initial(value):
            return f'{settings.MEDIA_URL}{value}'

    def is_initial(self, value):
        """
        Return whether value is considered to be initial value.
        """
        return bool(value and getattr(value, 'url', False))

    def get_context(self, name, value, attrs):
        context = super(DatePickerInput, self).get_context(name, value, {**(attrs if attrs else {}), **{
            'class': 'datepicker',
        }})
        #  Override string value
        context['widget']['value'] = value if isinstance(value, str) else context['widget']['value']
        return context

    @property
    def media(self):
        extra = '' if settings.DEBUG else '.min'
        if self.use_admin_site_jquery:
            return forms.Media(
                js=(
                    'admin/js/vendor/jquery/jquery%s.js' % extra,
                    'jquery-ui/jquery-ui%s.js' % extra,
                    # 'djeu/js/jquery-datepicker.js',
                    'djeu/js/i18n/datepicker-ru-RU.js',
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
                    'djeu/js/i18n/datepicker-ru-RU.js',
                    'djeu/js/jquery-datepicker.init.js',
                ),
                css={
                    'screen': (
                        'jquery-ui/jquery-ui.min.css',
                    ),
                },
            )