from calendar import monthrange
from datetime import datetime, date

from django import forms

from .widgets import PartialDatePickerInput


class PartialDateField(forms.DateField):

    widget = PartialDatePickerInput

    def __init__(self, *, input_formats=None, **kwargs):
        super().__init__(**{**kwargs, 'widget': PartialDateField.widget})
        if input_formats is not None:
            self.input_formats = input_formats

    @staticmethod
    def _int(value: str) -> int:
        if '_' in value:
            return 0
        return int(value)

    def strptime(self, value, format):
        if '_' in value: # Only %d.%m.%Y format supported
            if format != '%d.%m.%Y':
                raise BaseException(f'The date format \'{format}\' is not supported. Please, try to implement it.')
            iso_value = value.split('.')
            day = iso_value[0] if len(iso_value) > 0 else '__'
            month = iso_value[1] if len(iso_value) > 1 else '__'
            year = iso_value[2] if len(iso_value) > 2 else '____'
            return f'{year}-{month}-{day}'
        else:
            return datetime.strptime(value, format).date().isoformat()

    def prepare_value(self, value: str):
        if value is None:
            return value
        date = value.split('-')
        year = date[0] if len(date) > 0 else '____'
        month = date[1] if len(date) > 1 else '__'
        day = date[2] if len(date) > 2 else '__'
        return f'{day}.{month}.{year}'