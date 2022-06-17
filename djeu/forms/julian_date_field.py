from calendar import monthrange
from datetime import datetime, date

from django import forms
from djeu.utils.jdcal import jcal2jd, jd2gcal, gcal2jd, jd2jcal

from .widgets import JulianDatePickerInput


class JulianDateField(forms.DateField):

    widget = JulianDatePickerInput

    def __init__(self, *, input_formats=None, **kwargs):
        super().__init__(**{**kwargs, 'widget': JulianDateField.widget})
        if input_formats is not None:
            self.input_formats = input_formats

    @staticmethod
    def _int(value: str) -> int:
        if '_' in value:
            return 0
        return int(value)

    def strptime(self, value, format):
        formated_date = value
        if '(' in value:
            formated_date = value[:value.index('(')].strip()
        # Convert from julian to gregorian
        julian_day, julian_month, julian_year = [
            self._int(v) for v in formated_date.split('.')]
        year, month, day, _ = jd2gcal(
            *jcal2jd(julian_year, julian_month, julian_day))
        # super -> return datetime.strptime(value, format).date()s
        return datetime(year, month, day)

    def prepare_value(self, value: datetime):
        if isinstance(value, date):
            julian_year, julian_month, julian_day, _ = jd2jcal(*gcal2jd(value.year, value.month, value.day))
            return f'{julian_day:02d}.{julian_month:02d}.{julian_year:04d} ({value.year:04d}-{value.month:02d}-{value.day:02d})'
        return value