from __future__ import unicode_literals

import re

from django import forms
from django.utils.translation import ugettext_lazy as _

from ..conf import settings
from ..models import Subject

from django.core.exceptions import ImproperlyConfigured

# try:
#    import bleach
# except ImportError:
#    raise ImproperlyConfigured('django-crispy-contact-form application requires bleach package')

