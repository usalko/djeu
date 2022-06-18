from django.db.models.fields.related import ForeignKey, RelatedField
from djeu.forms.widgets import ExtendedModelMultipleChoiceField


class ExtendedForeignKey(ForeignKey):

    def __init__(self, to, on_delete, related_name=None, related_query_name=None,
                 limit_choices_to=None, parent_link=False, to_field=None,
                 db_constraint=True, depends=None, **kwargs):
        super(ExtendedForeignKey, self).__init__(to, on_delete, related_name, related_query_name,
                                                 limit_choices_to, parent_link, to_field, db_constraint,
                                                 **kwargs)
        self.depends = depends
