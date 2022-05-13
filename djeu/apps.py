from django.apps import AppConfig as DjangoAppConfig

from django import VERSION
if VERSION >= (2, 0):
    from django.utils.translation import gettext_lazy as _
else:
    from django.utils.translation import ugettext_lazy as _

class AppConfig(DjangoAppConfig):
    """Configuration for the djeu app"""
    label = name = 'djeu'
    verbose_name = _('DjEu')
