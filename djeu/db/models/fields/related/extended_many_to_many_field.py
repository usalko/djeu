from django.db.models.fields.related import ManyToManyField, RelatedField
from djeu.forms.widgets import ExtendedModelMultipleChoiceField


class ExtendedManyToManyField(ManyToManyField):

    def __init__(self, to, related_name=None, related_query_name=None,
                 limit_choices_to=None, symmetrical=None, through=None,
                 through_fields=None, db_constraint=True, db_table=None,
                 swappable=True, choices_queryset=None,
                 choices2_queryset=None, **kwargs):
        super().__init__(to, related_name, related_query_name, limit_choices_to or self._limit_choices_to,
                         symmetrical, through, through_fields, db_constraint, db_table,
                         swappable, **kwargs)
        self.choices_queryset = choices_queryset
        self.through = through
        self.through_fields = through_fields
        self.choices2_queryset = choices2_queryset

    def _limit_choices_to(self):
        return None

    def value_from_object(self, obj):
        return super(ExtendedManyToManyField, self).value_from_object(obj)

    def formfield(self, *, using=None, **kwargs):
        # self.remote_field.field.objects.all()
        # self.remote_field._default_manager.using(using)
        queryset = self.through.objects.all(
        ) if self.through else self.remote_field.field.objects.all()

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
