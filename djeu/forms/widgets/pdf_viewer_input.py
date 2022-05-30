from django import forms
from django.conf import settings


class PdfViewerInput(forms.FileInput):

    input_type = 'file'
    needs_multipart_form = True
    template_name = 'djeu/forms/widgets/pdf-viewer-input.html'
    #template_name = 'django/forms/widgets/clearable_file_input.html'

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
        return super(PdfViewerInput, self).get_context(name, value, {**attrs, **{
            'class': 'pdfViewer',
            'data-label': data_label,
            'url': url
        }})

    @property
    def media(self):
        extra = '' if settings.DEBUG else '.min'
        return forms.Media(
            js=(
                'admin/js/vendor/jquery/jquery%s.js' % extra,
                'djeu/js/jquery-pdf-viewer.js',
                'djeu/js/jquery-pdf-viewer.init.js',
            ) + (
                'admin/js/jquery.init.js',
            ),
            css={
                'screen': (
                    'djeu/css/jquery-pdf-viewer.default.css',
                ),
            },
        )
