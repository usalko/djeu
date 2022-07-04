from django.db.models import fields
from djeu import forms


DEFAULT_HELP_TEXT = ' <b> Формат ввода даты: дд.мм.гг.: 24.04.1934. ' + \
    'При отсутствии параметра использовать 2 нижних подчеркивания: 24.__.1934 </b>'


class PartialDateField(fields.CharField):

    def __init__(self, *args, db_collation=None, max_length=64, help_text=DEFAULT_HELP_TEXT, **kwargs):
        super(PartialDateField, self).__init__(
            *args,
            db_collation=db_collation,
            max_length=max_length,
            help_text=help_text,
            **kwargs)

    def formfield(self, **kwargs):
        result = fields.Field.formfield(self, **{
            'form_class': forms.PartialDateField,
            **kwargs,
        })
        return result

    def value_to_string(self, obj):
        return super(PartialDateField, self).value_to_string(obj)

    def get_db_prep_value(self, value, connection, prepared=False):
        return super(PartialDateField, self).get_db_prep_value(value, connection, prepared)

    def to_python(self, value):
        if isinstance(value, str) or value is None:
            return value
        return str(value)

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        return self.to_python(value)

    def __str__(self):
        return super(PartialDateField, self).__str__()

    def __repr__(self):
        return self.__str__()
