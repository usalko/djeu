from django import forms
from django.conf import settings


class LinkedFileInput(forms.FileInput):

    template_name = 'djeu/forms/widgets/linked-file-input.html'
    
    def __init__(self, *args, use_admin_site_jquery=False, **kwargs):
        super(LinkedFileInput, self).__init__(*args, **kwargs)
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
        data_label = 'Загрузить'
        if 'button-label' in self.attrs:
            data_label = self.attrs['button-label']
        if 'data-label' in self.attrs:
            data_label = self.attrs['data-label']
        url = f'{settings.MEDIA_URL}{value}' if value else None
        return super(LinkedFileInput, self).get_context(name, value, {**attrs, **{
            'class': 'filepicker',
            'data-label': data_label,
            'url': url
        }})

    @property
    def media(self):
        extra = '' if settings.DEBUG else '.min'
        if self.use_admin_site_jquery:
            return forms.Media(
                js=(
                    'admin/js/vendor/jquery/jquery%s.js' % extra,
                    'djeu/js/jquery-filepicker.js',
                    'djeu/js/jquery-filepicker.init.js',
                ) + (
                    'admin/js/jquery.init.js',
                ),
                css={
                    'screen': (
                        'djeu/css/filepicker.default.css',
                    ),
                },
            )
        else:
            return forms.Media(
                js=(
                    'djeu/js/jquery-filepicker.js',
                    'djeu/js/jquery-filepicker.init.js',
                ),
                css={
                    'screen': (
                        'djeu/css/filepicker.default.css',
                    ),
                },
            )
