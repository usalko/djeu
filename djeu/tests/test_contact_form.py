from __future__ import unicode_literals

from django.urls import reverse

from contact_form.tests.base import ContactFormCase
from contact_form.forms.uniform import ContactForm


class TestContactForm(ContactFormCase):

    def test_form_view(self):
        response = self.client.get(reverse('contact_form:contact_form'))
        self.assertEqual(response.status_code, 200)

    def test_valid_form(self):
        data = dict(
            sender_name='test',
            sender_email='test@test.com',
            subject=self.subject_foo.pk,
            message='test message from user foo',
            captcha='',
        )
        form = ContactForm(data=data)
        self.assertTrue(form.is_valid())

    def test_invalid_form(self):
        data = dict(
            sender_name='test',
            sender_email='test@test.com',
            subject='',
            message=''
        )
        form = ContactForm(data=data)
        self.assertFalse(form.is_valid())
