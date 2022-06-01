from django import forms
from django.conf import settings
from django.contrib.admin import widgets

from .extended_model_multiple_choice_field import \
    ExtendedModelMultipleChoiceField


class ExtendedAutocompleteSelectMultiple(widgets.AutocompleteSelectMultiple):

    template_name = 'djeu/forms/widgets/select.html'
    option_template_name = 'djeu/forms/widgets/select_option.html'

    # FIXME: https://stackoverflow.com/questions/63199404/django-choice-list-dynamic-choices
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def optgroups(self, name, value, attr=None):
        """Return selected options based on the ModelChoiceIterator."""
        default = (None, [], 0)
        groups = [default]
        has_selected = False
        selected_choices = {
            str(v) for v in value
            if str(v) not in self.choices.field.empty_values
        }
        if not self.is_required and not self.allow_multiple_selected:
            default[1].append(self.create_option(name, '', '', False, 0))
        if self.field.through:
            to_field_name = self.field.through_fields[-1]
        else:
            remote_model_opts = self.field.remote_field.model._meta
            to_field_name = getattr(self.field.remote_field, 'field_name', remote_model_opts.pk.attname)
            to_field_name = remote_model_opts.get_field(to_field_name).attname

        choices = (
            (getattr(obj, to_field_name), self.choices.field.label_from_instance(obj))
            for obj in self.choices.queryset.using(self.db).filter(**{'%s__in' % to_field_name: selected_choices})
        )
        for option_value, option_label in choices:
            selected = (
                str(option_value) in value and
                (has_selected is False or self.allow_multiple_selected)
            )
            has_selected |= selected
            index = len(default[1])
            subgroup = default[1]
            subgroup.append(self.create_option(
                name, option_value, option_label, selected_choices, index))
        return groups

    def get_context(self, name, value, attrs):
        # Request models and fields for the autocomplete requests
        # As an example:
        #
        # For the many to many field in document
        # through_fields = (document, relative, kind)
        # => relative: relationship
        # => kind: relationship
        extended_many_to_many_field = self.field
        relation_model_name = extended_many_to_many_field.through._meta.model_name
        owner_model_name = extended_many_to_many_field.model._meta.model_name
        result = super(ExtendedAutocompleteSelectMultiple, self).get_context(name, value, {**attrs, **{
            'data-components': [{field: relation_model_name} for field in extended_many_to_many_field.through_fields if field != owner_model_name],
        }})
        return result

    @property
    def media(self):
        extra = '' if settings.DEBUG else '.min'
        i18n_file = ('admin/js/vendor/select2/i18n/%s.js' %
                     self.i18n_name,) if self.i18n_name else ()
        return forms.Media(
            js=(
                'admin/js/vendor/jquery/jquery%s.js' % extra,
                'djeu/js/jquery-extended-autocomplete-select-multiply.js',
            ) + i18n_file + (
                'admin/js/jquery.init.js',
                'djeu/js/jquery-extended-autocomplete-select-multiply.init.js',
            ),
            css={
                'screen': (
                    'djeu/css/jquery-extended-autocomplete-select-multiply.css',
                    'djeu/css/autocomplete.mod.css',
                ),
            },
        )
