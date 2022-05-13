from __future__ import unicode_literals

from django.conf import settings
from django.urls import reverse_lazy

from django import VERSION
if VERSION >= (2, 0):
    from django.utils.translation import gettext_lazy as _
else:
    from django.utils.translation import ugettext_lazy as _


class DjeuAppConf:

    USE_CAPTCHA = getattr(settings, 'CONTACT_FORM_USE_CAPTCHA', False)
    USE_RECAPTCHA = getattr(settings, 'CONTACT_FORM_USE_RECAPTCHA', False)
    USE_SIGNALS = getattr(settings, 'CONTACT_FORM_USE_SIGNALS', False)
    SUCCESS_URL = getattr(settings, 'CONTACT_FORM_SUCCESS_URL', reverse_lazy('contact_form'))
    USE_SITES = getattr(settings, 'CONTACT_FORM_USE_SITES', True)
    FILTER_SENDER_NAME = getattr(settings, 'CONTACT_FORM_FILTER_SENDER_NAME', True)
    FILTER_MESSAGE = getattr(settings, 'CONTACT_FORM_FILTER_MESSAGE', True)
    ALLOWED_MESSAGE_TAGS = getattr(settings, 'CONTACT_FORM_ALLOWED_MESSAGE_TAGS', [])
    STRIP_MESSAGE = getattr(settings, 'CONTACT_FORM_STRIP_MESSAGE', False)
    LINKS_NOT_ALLOWED = getattr(settings, 'CONTACT_FORM_LINKS_NOT_ALLOWED', False)
    VALID_MESSAGE = getattr(
        settings,
        'CONTACT_FORM_VALID_MESSAGE',
        _('Your message is submitted')
    )

    INVALID_MESSAGE = getattr(
        settings,
        'CONTACT_FORM_INVALID_MESSAGE',
        _('Something went wrong, your message was not submitted!')
    )

    USE_USERNAME = getattr(settings, 'CONTACT_FORM_USE_USERNAME', True)
    USERNAME_FIELD = getattr(settings, 'CONTACT_FORM_USERNAME_FIELD', 'username')
    USE_USER_EMAIL = getattr(settings, 'CONTACT_FORM_USE_USER_EMAIL', True)
    USER_EMAIL_FIELD = getattr(settings, 'CONTACT_FORM_USER_EMAIL_FIELD', 'email')

    SENDER_NAME_MAX_LENGTH = getattr(settings, 'CONTACT_FORM_SENDER_NAME_MAX_LENGTH', 80)
    SUBJECT_MAX_LENGTH = getattr(settings, 'CONTACT_FORM_SUBJECT_MAX_LENGTH', 80)
    MESSAGE_MAX_LENGTH = getattr(settings, 'CONTACT_FORM_MESSAGE_MAX_LENGTH', 4096)
    MESSAGE_MIN_LENGTH = getattr(settings, 'CONTACT_FORM_MESSAGE_MIN_LENGTH', 15)

    DEPARTMENT_NAME_MAX_LENGTH = getattr(settings, 'CONTACT_FORM_DEPARTMENT_NAME_MAX_LENGTH', 80)
    DEPARTMENT_PHONE_MAX_LENGTH = getattr(settings, 'CONTACT_FORM_DEPARTMENT_PHONE_MAX_LENGTH', 20)

    SUBJECTS_ORDER_BY = getattr(settings, 'CONTACT_FORM_SUBJECTS_ORDER_BY', 'order')

    FORM_MODULE = getattr(settings, 'CONTACT_FORM_FORM_MODULE', 'contact_form.forms.uniform')

    FORM_CAPTCHA_MODULE = getattr(
        settings, 'CONTACT_FORM_FORM_CAPTCHA_MODULE', 'contact_form.forms.uniform'
    )

    FORM_TEMPLATE = getattr(settings, 'CONTACT_FORM_FORM_TEMPLATE', 'contact_form/form.html')

    RENDER_CANCEL_BUTTON = getattr(settings, 'CONTACT_FORM_RENDER_CANCEL_BUTTON', False)

    FORM_LABEL_CLASS = getattr(settings, 'CONTACT_FORM_FORM_LABEL_CLASS', '')
    FORM_FIELD_CLASS = getattr(settings, 'CONTACT_FORM_FORM_FIELD_CLASS', '')

    class Meta:
        prefix = 'contact_form'
