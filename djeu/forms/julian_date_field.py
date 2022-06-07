from django import forms
from .widgets import DatePickerInput
from datetime import datetime
from calendar import monthrange


class JulianDateField(forms.DateField):

    widget = DatePickerInput

    def __init__(self, *, input_formats=None, **kwargs):
        super().__init__(**{**kwargs, 'widget': JulianDateField.widget})
        if input_formats is not None:
            self.input_formats = input_formats

    @staticmethod
    def julian_date_to_julian_mmddyyyy(y, jd):
        month = 1
        day = 0
        while jd - monthrange(y, month)[1] > 0 and month <= 12:
            jd = jd - monthrange(y, month)[1]
            month = month + 1
        return month, jd, y

    @staticmethod
    def julian_mmddyyyy_to_julian_date(year: int, month: int, day: int):
        jd = 0
        for month_number in range(1, month):
            jd += monthrange(year, month_number)[1]
        return year, jd + day

    @staticmethod
    def trunc_div(a, b):
        """Implement 'truncated division' in Python."""
        return (a // b) if a >= 0 else -(-a // b)

    @staticmethod
    def _julian_day(year, month, day):
        '''
        Convert Gregorian date to julian day number.
        http://adsabs.harvard.edu/abs/1979ApJS...41..391V
        '''
        return 367 * year - trunc_div(7 * (year + trunc_div(month + 9, 12)), 4) - trunc_div(3 * (trunc_div(year + trunc_div(month - 9, 7), 100) + 1), 4) + trunc_div(275 * month, 9) + day + 1721029

    @staticmethod
    def _int(value: str) -> int:
        if '_' in value:
            return 0
        return int(value)

    def strptime(self, value, format):
        # Convert from julian to gregorian
        day, month, year = [self._int(v) for v in value.split('.')]
        _, jd = self.julian_mmddyyyy_to_julian_date(year, month, day)
        # super -> return datetime.strptime(value, format).date()s
        return datetime.strptime(f'{year}{jd}', '%Y%j').date()
