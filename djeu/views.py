"""Implements contact form view"""

from __future__ import unicode_literals

import importlib

try:
    import bleach
except ImportError:
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured('django-crispy-contact-form application requires bleach package')

from django.views.generic import CreateView

from appcore.views.mixins import FormMessageMixin

from .conf import settings
from .signals import contact_form_valid, contact_form_invalid
from .helpers import get_user_ip


form_module = importlib.import_module(settings.CONTACT_FORM_FORM_MODULE)

if settings.CONTACT_FORM_USE_CAPTCHA or settings.CONTACT_FORM_USE_RECAPTCHA:
    form_captcha_module = importlib.import_module(settings.CONTACT_FORM_FORM_CAPTCHA_MODULE)


class ContactFormView(FormMessageMixin, CreateView):
    """Contact form view"""

    template_name = settings.CONTACT_FORM_FORM_TEMPLATE
    success_url = settings.CONTACT_FORM_SUCCESS_URL

    form_valid_message = settings.CONTACT_FORM_VALID_MESSAGE
    form_invalid_message = settings.CONTACT_FORM_INVALID_MESSAGE

    valid_event = 'CONTACT_FORM_VALID_MESSAGE'
    invalid_event = 'CONTACT_FORM_INVALID_MESSAGE'

    site = None

    def get_form_class(self):
        if hasattr(self.request, 'user'):
            is_authenticated = self.request.user.is_authenticated
        else:
            is_authenticated = False
        if not is_authenticated and (settings.CONTACT_FORM_USE_CAPTCHA or settings.CONTACT_FORM_USE_RECAPTCHA):
            self.form_class = form_captcha_module.ContactFormCaptcha
        else:
            self.form_class = form_module.ContactForm
        return self.form_class

    def get_initial(self):
        sender_name = ''
        sender_email = ''
        if hasattr(self.request, 'user'):
            user = self.request.user
            if settings.CONTACT_FORM_USE_USERNAME and user.is_authenticated:
                if hasattr(user, settings.CONTACT_FORM_USERNAME_FIELD):
                    sender_name = getattr(user, settings.CONTACT_FORM_USERNAME_FIELD)
                if hasattr(user, settings.CONTACT_FORM_USER_EMAIL_FIELD):
                    sender_email = getattr(user, settings.CONTACT_FORM_USER_EMAIL_FIELD)
        initial = {'sender_name': sender_name, 'sender_email': sender_email}
        if hasattr(settings, 'SITE_ID') and settings.CONTACT_FORM_USE_SITES:
            from django.contrib.sites.models import Site
            site = Site.objects.get(id=settings.SITE_ID)
            self.site = site
        return initial

    def form_valid(self, form):
        """This is what's called when the form is valid."""
        instance = form.save(commit=False)
        if hasattr(self.request, 'user'):
            instance.user = self.request.user
        if settings.CONTACT_FORM_FILTER_MESSAGE:
            instance.message = bleach.clean(
                instance.message,
                tags=settings.CONTACT_FORM_ALLOWED_MESSAGE_TAGS,
                strip=settings.CONTACT_FORM_STRIP_MESSAGE
            )
        instance.ip = get_user_ip(self.request)
        instance.site = self.site
        instance.save()
        if settings.CONTACT_FORM_USE_SIGNALS:
            contact_form_valid.send(
                sender=self,
                event=self.valid_event,
                ip=instance.ip,
                site=self.site,
                sender_name=instance.sender_name,
                sender_email=instance.sender_email,
                email=instance.subject.department.email,
                subject=instance.subject.title,
                message=instance.message
            )

        return super(ContactFormView, self).form_valid(form)

    def form_invalid(self, form):
        """This is what's called when the form is invalid."""
        ip = get_user_ip(self.request)
        if settings.CONTACT_FORM_USE_SIGNALS:
            contact_form_invalid.send(
                sender=self,
                event=self.invalid_event,
                ip=ip,
                site=self.site,
                sender_name=form['sender_name'],
                sender_email=form['sender_email']
            )

        return super(ContactFormView, self).form_invalid(form)
