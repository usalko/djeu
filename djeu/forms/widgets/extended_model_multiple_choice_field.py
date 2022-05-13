from django.forms.models import ModelMultipleChoiceField

class ExtendedModelMultipleChoiceField(ModelMultipleChoiceField):

    def __init__(self, queryset, **kwargs):
        super().__init__(queryset, **kwargs)

    def label_from_instance(self, obj):
        """
        Convert objects into strings and generate the labels for the choices
        presented by this object. Subclasses can override this method to
        customize the display of the choices.
        """
        return str(obj)