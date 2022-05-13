from django.conf.urls import include, url

urlpatterns = [
    # contact_form
    url(r'^contact_form/', include('contact_form.urls', namespace='contact_form')),
]
