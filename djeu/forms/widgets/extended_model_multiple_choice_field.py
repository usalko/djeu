from typing import Optional
from re import split as regexp_split
from django.forms.models import ModelMultipleChoiceField
from django.db import models


class ExtendedModelMultipleChoiceField(ModelMultipleChoiceField):

    def __init__(self, queryset, **kwargs):
        super().__init__(queryset, **kwargs)
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
        missed_key_key = f'{django_model._meta.model_name}.{particular_value}'.lower()
        if missed_key_key in self.missed_keys_cache:
            return self.missed_keys_cache[missed_key_key]

        instance = django_model()
        tokens = regexp_split(r'\s+', particular_value)
        char_fields = [field for field in django_model._meta.fields if isinstance(field, models.CharField)]
        if len(tokens) <= len(char_fields):
            for i in range(0, len(tokens)):
                setattr(instance, char_fields[i].attname, tokens[i])
        elif len(char_fields) > 0:
            setattr(instance, char_fields[0].name, particular_value)
        else:
            raise BaseException('Can\'t set automatically {particular_value} for {django_model}. Try to do in manual manner.')

        instance.save()
        self.missed_keys_cache[missed_key_key] = instance.pk
        return instance.pk

    def _compound_key_values(self, through, compound_key, values, missed_key_procedure):
        result_count = 0
        result = None
        for value in values:
            compound_key_values = dict()
            previous_comma_position = 0
            comma_position = str(value).find(',')
            for particular_field_name in compound_key:
                particular_field_value = str(
                    value)[previous_comma_position:comma_position]
                pk_value = int(
                    particular_field_value) if particular_field_value.isdigit() else None
                if not pk_value and missed_key_procedure:
                    # For ForeignKey
                    django_model = through._meta.get_field(
                        particular_field_name).related_model
                    pk_value = missed_key_procedure(
                        django_model, particular_field_value)
                if not pk_value:
                    break
                compound_key_values[particular_field_name] = pk_value

                previous_comma_position = comma_position + 1
                comma_position = str(value).find(',', previous_comma_position)

            # check full key
            if len(compound_key_values) == len(compound_key):
                result_count += 1
                if result_count == 1:
                    result = compound_key_values
                elif result_count == 2:
                    for particular_field_name in compound_key_values:
                        result[particular_field_name] = [
                            result[particular_field_name], compound_key_values[particular_field_name]]
                else:
                    for particular_field_name in compound_key_values:
                        result[particular_field_name].append(
                            compound_key_values[particular_field_name])

        return result, result_count

    def clean(self, value):
        if self.widget and self.widget.field and self.widget.field.through:
            # Search by field. Eager approach
            through = self.widget.field.through
            compound_key = self.widget.field.key_data_components
            compound_key_values, compound_key_values_count = \
                self._compound_key_values(
                    through, compound_key, value, self._default_procedure_to_missed_key)
            # create relations
            if compound_key_values_count == 1:
                result = list(through.objects.filter(**{k: v for k, v in compound_key_values.items()}))
                return result if result else [through(**{f'{k}_id': v for k, v in compound_key_values.items()})]
            elif compound_key_values_count > 1:
                result = list(through.objects.filter(**{'%s__in' % k: v for k, v in compound_key_values.items()}))
                result_index = {tuple([getattr(x, attname) for attname in compound_key]): x for x in result}
                # merge
                for i in range(0, compound_key_values_count):
                    compound_key_value = tuple([v[i] for k, v in compound_key_values.items()])
                    if not compound_key_value in result_index:
                        result.append(through(**{f'{compound_key[i]}_id': compound_key_value[i] for i in range(0, len(compound_key))}))
                return result
            else:
                return self.queryset.none()

        return super(ExtendedModelMultipleChoiceField, self).clean(value)
