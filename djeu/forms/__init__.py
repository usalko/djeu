from __future__ import unicode_literals

import re

from django import forms

from django import VERSION
if VERSION >= (2, 0):
    from django.utils.translation import gettext_lazy as _
else:
    from django.utils.translation import ugettext_lazy as _

from ..conf import settings
# from ..models import Subject

from django.core.exceptions import ImproperlyConfigured

# try:
#    import bleach
# except ImportError:
#    raise ImproperlyConfigured('django-crispy-contact-form application requires bleach package')

from .julian_date_field import *
from .partial_date_field import *
from .extended_model_choice_field import *
from .extended_model_multiple_choice_field import *
from .nationality_model_choice_field import *