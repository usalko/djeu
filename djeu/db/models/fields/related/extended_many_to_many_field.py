from django.db.models.fields.related import ManyToManyField, RelatedField
from djeu.forms.widgets import ExtendedModelMultipleChoiceField


class ExtendedManyToManyField(ManyToManyField):

    def formfield(self, *, using=None, **kwargs):
        # self.remote_field.field.objects.all()
        # self.remote_field._default_manager.using(using)
        from mem.models import Relationship
        from mem.models import Person
        defaults = {
            'form_class': ExtendedModelMultipleChoiceField,
            # 'queryset': Person.objects.all(),
            'queryset': Relationship.objects.all(),
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