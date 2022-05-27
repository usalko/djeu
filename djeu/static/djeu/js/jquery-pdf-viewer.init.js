// PDF-VIEWER
(function (factory, jQuery) {
  if (typeof define === 'function' && define.amd) {
    define('pdfViewer.init', ['jquery'], factory);
  } else if (typeof exports === 'object') {
    factory(require('jquery'));
  } else {
    factory(jQuery);
  }
})(function ($) {
  $(function () {
    $('.pdfViewer').pdfViewer({
    });
  });
}, window.jQuery);