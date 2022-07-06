from re import split as regexp_split
from typing import Optional

from django.db import models
from django.db.models import Manager
from django.contrib import admin
from django.forms.models import ModelChoiceField

from .widgets.nationality_autocomplete_select import NationalityAutocompleteSelect


class NationalityModelChoiceField(ModelChoiceField):

    widget = NationalityAutocompleteSelect

    def __init__(self, queryset, **kwargs):
        if 'widget' in kwargs:
            widget = kwargs.pop('widget')
            kwargs.pop('django_field')
        else:
            widget = self.widget(kwargs.pop('django_field'), admin.site)
        super().__init__(queryset,
                         widget=widget,
                         **kwargs)
        self.missed_keys_cache = dict()

    def label_from_instance(self, obj):
        """
        Convert objects into strings and generate the labels for the choices
        presented by this object. Subclasses can override this method to
        customize the display of the choices.
        """
        return str(obj)

    def to_python(self, value):
        return value

    def _default_procedure_to_missed_key(self, django_model, particular_value) -> Optional[int]:
        missed_key_key = f'{django_model._meta.model_name}.{particular_value}'.lower(
        )
        if missed_key_key in self.missed_keys_cache:
            return self.missed_keys_cache[missed_key_key]

        instance = django_model()
        tokens = regexp_split(r'\s+', particular_value)
        char_fields = [field for field in django_model._meta.fields if isinstance(
            field, models.CharField)]
        if len(tokens) <= len(char_fields):
            for i in range(0, len(tokens)):
                setattr(instance, char_fields[i].attname, tokens[i])
        elif len(char_fields) > 0:
            setattr(instance, char_fields[0].name, particular_value)
        else:
            raise BaseException(
                'Can\'t set automatically {particular_value} for {django_model}. Try to do in manual manner.')

        instance.save()
        self.missed_keys_cache[missed_key_key] = instance.pk
        return instance.pk

    def _compound_key_values(self, through, compound_key, additional_fields,
                             values, missed_key_procedure):
        result_count = 0
        result = None
        for value in values:  # value is comma searatd string
            compound_key_values = dict()
            previous_comma_position = 0
            comma_position = str(value).find(',')
            for particular_field_name in compound_key:
                particular_field_value = str(value)[
                    previous_comma_position:comma_position] if comma_position > -1 else str(value)[previous_comma_position:]
                pk_value = int(
                    particular_field_value) if particular_field_value.isdigit() else None
                if not pk_value and missed_key_procedure:
                    # For ForeignKey
                    django_model = through
                    pk_value = missed_key_procedure(
                        django_model, particular_field_value)
                if not pk_value:
                    break
                compound_key_values[particular_field_name] = pk_value

                previous_comma_position = comma_position + 1 if comma_position > -1 else -1
                if previous_comma_position > -1:
                    comma_position = str(value).find(
                        ',', previous_comma_position)

            additional_fields_values = dict()
            for additional_field_name in additional_fields:
                if previous_comma_position == -1 and comma_position == -1:
                    additional_fields_values[additional_field_name] = ''
                    continue
                particular_field_value = str(value)[previous_comma_position:] if comma_position == -1 else str(
                    value)[previous_comma_position:comma_position]
                additional_fields_values[additional_field_name] = particular_field_value

                previous_comma_position = comma_position + 1 if comma_position > -1 else -1
                if previous_comma_position > -1:
                    comma_position = str(value).find(
                        ',', previous_comma_position)

            # check full key
            if len(compound_key_values) == len(compound_key):
                stored_values = {**compound_key_values,
                                 **additional_fields_values}
                result_count += 1
                if result_count == 1:
                    result = stored_values
                elif result_count == 2:
                    for particular_field_name in [*compound_key_values, *additional_fields]:
                        result[particular_field_name] = [
                            result[particular_field_name], stored_values[particular_field_name]]
                else:
                    for particular_field_name in [*compound_key_values, *additional_fields]:
                        result[particular_field_name].append(
                            stored_values[particular_field_name])

        return result, result_count

    def _request_explicit_values(self, entity_class, key_fields, additional_fields, value):
        compound_values, compound_values_count = \
            self._compound_key_values(
                entity_class, key_fields, additional_fields, value, self._default_procedure_to_missed_key)
        # create relations
        if compound_values_count > 0:
            result = list(entity_class.objects.filter(
                **{k: v for k, v in compound_values.items()})) if compound_values_count == 1 else \
                list(entity_class.objects.filter(
                    **{'%s__in' % k: v for k, v in compound_values.items()}))
            result_index = {
                tuple([getattr(x, attname).pk for attname in key_fields]): x for x in result}
            # merge
            for i in range(0, compound_values_count):
                compound_key_value = tuple(
                    [v[i] if compound_values_count > 1 else v for k, v in compound_values.items() if k in key_fields])
                if not compound_key_value in result_index:
                    entity_instance = entity_class(
                        **{**{f'{key_fields[j]}_id': compound_key_value[j] for j in range(0, len(key_fields))},
                           **{additional_fields[j]: compound_values[additional_fields[j]][i] if compound_values_count > 1 else compound_values[additional_fields[j]] for j in range(0, len(additional_fields))}})
                    result_index[compound_key_value] = entity_instance
                else:
                    for j in range(0, len(additional_fields)):
                        setattr(result_index[compound_key_value],
                                additional_fields[j],
                                compound_values[additional_fields[j]][i] if compound_values_count > 1 else compound_values[additional_fields[j]])

            return result_index.values()
        else:
            return self.queryset.none()

    def _request_implicit_values(self, entity_class, value):
        key_fields = ('id', )
        compound_values, compound_values_count = \
            self._compound_key_values(
                entity_class, key_fields, (), value, self._default_procedure_to_missed_key)
        # create relations
        if compound_values_count == 1:
            result = list(entity_class.objects.filter(
                **{k: v for k, v in compound_values.items()}))
            return result if result else [entity_class(**{f'{k}' if k in key_fields else k: v for k, v in compound_values.items()})]
        elif compound_values_count > 1:
            result = list(entity_class.objects.filter(
                **{'%s__in' % k: v for k, v in compound_values.items()}))
            result_index = {
                tuple([getattr(x, attname) for attname in key_fields]): x for x in result}
            # merge
            for i in range(0, compound_values_count):
                compound_key_value = tuple(
                    [v[i] for k, v in compound_values.items()])
                if not compound_key_value in result_index:
                    result.append(entity_class(
                        **{**{f'{key_fields[i]}': compound_key_value[i] for i in range(0, len(key_fields))}}))
            return result
        else:
            return self.queryset.none()

    def _remote_model(self):
        if hasattr(self.widget, 'widget') and self.widget.widget.__class__.__name__ == 'NationalityAutocompleteSelect':
            return self.widget.widget.field.remote_field.model
        if self.widget.__class__.__name__ == 'NationalityAutocompleteSelect':
            return self.widget.field.remote_field.model
        raise BaseException('The widget NationalityAutocompleteSelect was not found')

    def clean(self, value):
        # if self.widget and self.widget.field and self.widget.field.through:
        #     # Search by field. Eager approach
        #     through = self.widget.field.through
        #     compound_key = self.widget.field.key_data_components
        #     additional_fields = self.widget.field.additional_fields

        #     return self._request_explicit_values(through, compound_key, additional_fields, value)

        if not value:
            return None
        result = self._request_implicit_values(self._remote_model(), [value])
        if result:
            return result[0]
        return None
