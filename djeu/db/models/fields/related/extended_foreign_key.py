from django.db.models.fields.related import ForeignKey, RelatedField
from djeu.forms import ExtendedModelChoiceField


class ExtendedForeignKey(ForeignKey):

    def __init__(self, to, on_delete, related_name=None, related_query_name=None,
                 limit_choices_to=None, parent_link=False, to_field=None,
                 db_constraint=True, depends=None, key_data_components=None,
                 **kwargs):
        super(ExtendedForeignKey, self).__init__(to, on_delete, related_name, related_query_name,
                                                 limit_choices_to, parent_link, to_field, db_constraint,
                                                 **kwargs)
        self.depends = depends
        self.additional_fields = ()

    @property
    def key_data_components(self):
        return (self.name, )

    def formfield(self, form_class=None, choices_form_class=None, **kwargs):
        # self.remote_field.field.objects.all()
        # self.remote_field._default_manager.using(using)
        queryset = self.remote_field.model.objects.all()

        defaults = {
            'django_field': self,
            'form_class': ExtendedModelChoiceField,
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
