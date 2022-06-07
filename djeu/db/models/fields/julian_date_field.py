from django.db.models import fields
from djeu import forms


class JulianDateField(fields.DateField):

    def formfield(self, **kwargs):
        return fields.Field.formfield(self, **{
            'form_class': forms.JulianDateField,
            **kwargs,
        })
