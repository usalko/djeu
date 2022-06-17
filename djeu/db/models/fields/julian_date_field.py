from django.db.models import fields
from djeu import forms
from djeu.utils.jdcal import jcal2jd, jd2gcal, gcal2jd, jd2jcal


class JulianDateField(fields.DateField):

    def formfield(self, **kwargs):
        return fields.Field.formfield(self, **{
            'form_class': forms.JulianDateField,
            **kwargs,
        })

    def value_to_string(self, obj):
        val = self.value_from_object(obj)
        julian_year, julian_month, julian_day, _ = jd2jcal(*gcal2jd(val.year, val.month, val.day))
        return '' if val is None else f'{julian_day}.{julian_month}.{julian_year}({val.isoformat()})'
