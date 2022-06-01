'use strict';
{
    const $ = django.jQuery;

    $.fn.adminExtendedAutocompleteSelectMultiply = function() {
        $.each(this, function(i, element) {
            $(element).extendedAutocompleteSelectMultiply({
                ajax: {
                    data: (params) => {
                        var component_selector = params.component_selector || 0;
                        var data_components = JSON.parse(element.dataset.components.replaceAll("'", '"'));
                        return {
                            term: params.term,
                            page: params.page,
                            app_label: element.dataset.appLabel,
                            // model_name: element.dataset.modelName,
                            // field_name: element.dataset.fieldName
                            model_name: Object.values(data_components[component_selector])[0],
                            field_name: Object.keys(data_components[component_selector])[0],
                        };
                    }
                }
            });
        });
        return this;
    };

    $(function() {
        // Initialize all autocomplete widgets except the one in the template
        // form used when a new formset is added.
        $('.admin-autocomplete').not('[name*=__prefix__]').adminExtendedAutocompleteSelectMultiply();
    });

    $(document).on('formset:added', (function() {
        return function(event, $newFormset) {
            return $newFormset.find('.admin-autocomplete').adminExtendedAutocompleteSelectMultiply();
        };
    })(this));
}
