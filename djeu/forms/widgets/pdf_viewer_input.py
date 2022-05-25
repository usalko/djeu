from django import forms
from django.conf import settings


class PdfViewerInput(forms.FileInput):

    template_name = 'djeu/forms/widgets/pdf-viewer-input.html'

    def format_value(self, value):
        """File input never renders a value."""
        if self.is_initial(value):
            return f'{settings.MEDIA_URL}{value}'

    def is_initial(self, value):
        """
        Return whether value is considered to be initial value.
        """
        return bool(value and getattr(value, 'url', False))

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
                    #'djeu/css/pdf-viewer.default.css',
                ),
            },
        )
