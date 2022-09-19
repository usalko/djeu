'use strict'; {
    const $ = jQuery;

    $.fn.adminExtendedAutocompleteSelectMultiply = function () {
        $.each(this, function (i, element) {
            $(element).extendedAutocompleteSelectMultiply({
                ajax: {
                    data: (params) => {
                        if (params.model && params.field) {
                            return {
                                q: params.term,
                                term: params.term,
                                page: params.page,
                                app_label: element.dataset.appLabel,
                                // model_name: element.dataset.modelName,
                                // field_name: element.dataset.fieldName
                                model_name: params.model,
                                field_name: params.field,
                            };
                        }
                        return null;
                    }
                }
            });
        });
        return this;
    };

    $(function () {
        // Initialize all autocomplete widgets except the one in the template
        // form used when a new formset is added.
        $('.admin-autocomplete').not('[name*=__prefix__]').adminExtendedAutocompleteSelectMultiply();
    });

    $(document).on('formset:added', (function () {
        return function (event, $newFormset) {
            return $newFormset.find('.admin-autocomplete').adminExtendedAutocompleteSelectMultiply();
        };
    })(this));
}