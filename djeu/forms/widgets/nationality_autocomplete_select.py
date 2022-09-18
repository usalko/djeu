from json import dumps
from typing import Tuple
from django import forms
from django.conf import settings
from django.contrib.admin import widgets
from json import dumps


class NationalityAutocompleteSelect(widgets.AutocompleteSelect):

    template_name = 'djeu/forms/widgets/select.html'
    option_template_name = 'djeu/forms/widgets/select_option.html'
    
    def __init__(self, *args, use_admin_site_jquery=False, **kwargs):
        super(NationalityAutocompleteSelect, self).__init__(*args, **kwargs)
        self.use_admin_site_jquery = use_admin_site_jquery

    # FIXME: https://stackoverflow.com/questions/63199404/django-choice-list-dynamic-choices
    def __init__(self, *args, **kwargs):
        self.additional_data_components = kwargs.pop(
            'additional_data_components', None)
        super(NationalityAutocompleteSelect, self).__init__(*args, **kwargs)
        self.allow_multiple_selected = False

    def _label(self, obj) -> str:
        return str(obj)

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
        remote_model_opts = self.field.remote_field.model._meta
        to_field_name = getattr(
            self.field.remote_field, 'field_name', remote_model_opts.pk.attname)
        to_field_name = remote_model_opts.get_field(to_field_name).attname

        choices = (
            (getattr(obj, to_field_name),
                self.choices.field.label_from_instance(obj))
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

    def create_option(self, name, value, label, selected, index, subindex=None, attrs=None):
        result = super(NationalityAutocompleteSelect, self).create_option(
            name, value, label, selected, index, subindex, attrs)
        if attrs:
            result['attrs'] = {**result['attrs'], **attrs}
        return result

    def get_context(self, name, value, attrs):
        # Request models and fields for the autocomplete requests
        # As an example:
        #
        # For the many to many field in document
        # through_fields = (document, relative, kind)
        # => relative: relationship
        # => kind: relationship
        exteded_foreign_key_field = self.field
        relation_model_name = exteded_foreign_key_field.model._meta.model_name
        # owner_model_name = exteded_foreign_key_field.model._meta.model_name

        data_components = [{field: relation_model_name}
                           for field in exteded_foreign_key_field.key_data_components]
        if self.additional_data_components:
            for additional_data_component in self.additional_data_components:
                if additional_data_component in data_components:
                    data_components.remove(additional_data_component)
            data_components.extend(self.additional_data_components)

        result = super(NationalityAutocompleteSelect, self).get_context(name, value, {**attrs, **{
            'data-components': dumps(data_components),
            'data-data': dumps([]),
            'data-tags': True,
        }})
        # remove garbage
        widget_attrs = result['widget']['attrs']
        # if 'data-model-name' in widget_attrs:
        #     del widget_attrs['data-model-name']
        # if 'data-field-name' in widget_attrs:
        #     del widget_attrs['data-field-name']
        return result

    @property
    def media(self):
        extra = '' if settings.DEBUG else '.min'
        i18n_file = ('admin/js/vendor/select2/i18n/%s.js' %
                     self.i18n_name,) if self.i18n_name else ()
        if self.use_admin_site_jquery:
            return forms.Media(
                js=(
                    'admin/js/vendor/jquery/jquery%s.js' % extra,
                    'djeu/js/jquery-nationality-autocomplete-select-multiply.js',
                ) + i18n_file + (
                    'admin/js/jquery.init.js',
                    'djeu/js/jquery-nationality-autocomplete-select-multiply.init.js',
                ),
                css={
                    'screen': (
                        'djeu/css/jquery-nationality-autocomplete-select-multiply.css',
                        'djeu/css/nationality-autocomplete.mod.css',
                    ),
                },
            )
        else:
            return forms.Media(
                js=(
                    'djeu/js/jquery-nationality-autocomplete-select-multiply.js',
                ) + i18n_file + (
                    'djeu/js/jquery-nationality-autocomplete-select-multiply.init.js',
                ),
                css={
                    'screen': (
                        'djeu/css/jquery-nationality-autocomplete-select-multiply.css',
                        'djeu/css/nationality-autocomplete.mod.css',
                    ),
                },
            )
