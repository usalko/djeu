// DATE PICKER
(function (factory, jQuery) {
    if (typeof define === 'function' && define.amd) {
      define('datepicker.init', ['jquery'], factory);
    } else if (typeof exports === 'object') {
      factory(require('jquery'));
    } else {
      factory(jQuery);
    }
  })(function ($) {
    $(function() {
        $( '.datepicker' ).datepicker({
            changeMonth: true,
            changeYear: true,
            yearRange: '1850:2050',
            dateFormat: 'dd.mm.yy',
            regional: 'ru-RU',
        });
    });
}, window.jQuery);