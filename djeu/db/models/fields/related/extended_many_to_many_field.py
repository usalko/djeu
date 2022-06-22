from django.db.models.fields.related import ManyToManyField, RelatedField
from djeu.forms.widgets import ExtendedModelMultipleChoiceField


class ExtendedManyToManyField(ManyToManyField):

    def __init__(self, to, related_name=None, related_query_name=None,
                 limit_choices_to=None, symmetrical=None, through=None,
                 through_fields=None, db_constraint=True, db_table=None,
                 swappable=True, key_data_components=None, additional_fields=None,
                 **kwargs):
        super().__init__(to, related_name, related_query_name, limit_choices_to or self._limit_choices_to,
                         symmetrical, through, through_fields, db_constraint, db_table,
                         swappable, **kwargs)
        self.through = through
        self.key_data_components = key_data_components if key_data_components else tuple(
            [attname for attname in through_fields if attname != self.remote_field.name]) if through_fields else []
        self.additional_fields = additional_fields

    def _limit_choices_to(self):
        return None

    def value_from_object(self, obj):
        if self.through:
            through_attname = self.remote_field.name
            return [] if obj.pk is None else list(self.through.objects.filter(**{through_attname: obj}))
        return super(ExtendedManyToManyField, self).value_from_object(obj)

    def formfield(self, *, using=None, **kwargs):
        # self.remote_field.field.objects.all()
        # self.remote_field._default_manager.using(using)
        queryset = self.through.objects.all(
        ) if self.through else self.remote_field.model._default_manager.using(using)

        defaults = {
            'form_class': ExtendedModelMultipleChoiceField,
            'queryset': queryset,
            **kwargs,
        }
        # If initial is passed in, it's a list of related objects, but the
        # MultipleChoiceField takes a list of IDs.
        if defaults.get('initial') is not None:
            initial = defaults['initial']
            if callable(initial):
                initial = initial()
            defaults['initial'] = [i.pk for i in initial]
        return super(RelatedField, self).formfield(**defaults)

    def get_prep_value(self, value):
        return super(ExtendedManyToManyField, self).get_prep_value(value)

    def add(self, obj):
        return super(ExtendedManyToManyField, self).add(obj)

    def __str__(self):
        if self.through:
            # self.through.objects
            return ', '.join(self.all())

        return super(ExtendedManyToManyField, self).__str__()

    def __repr__(self):
        self.__str__()
