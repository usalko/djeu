"""Django urls for contact form."""

from django.conf.urls import url

from contact_form.views import ContactFormView

app_name = 'contact_form'
urlpatterns = [url(r'^$', ContactFormView.as_view(), name='contact_form')]
