from django.apps import AppConfig as DjangoAppConfig
from django.utils.translation import ugettext_lazy as _


class AppConfig(DjangoAppConfig):
    """Configuration for the contact_form app"""
    label = name = 'contact_form'
    verbose_name = _('Contact Form')
