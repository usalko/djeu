// FILE PICKER
(function (factory, jQuery) {
  if (typeof define === 'function' && define.amd) {
    define('filepicker.init', ['jquery'], factory);
  } else if (typeof exports === 'object') {
    factory(require('jquery'));
  } else {
    factory(jQuery);
  }
})(function ($) {
  $(function () {
    $("input.filepicker[type='file']").each(function () {
      var ui = null;
      $(this).filepicker({
        renderUI: function (element, button, input, preview) {
          if (!ui) {
            ui = document.createElement('div');
            ui.appendChild(button);
            // we don't want the input here
            ui.appendChild(input);
            ui.appendChild(preview);
            element.parentNode.insertBefore(ui, element);
          }
          button.innerHTML = $(element).data('label');
          return false;
        },
        renderThumbnail: function (img, file) {
          $(img).wrap($('<div style="border: 1px solid #CCCCCC; border-radius: 0px; background: #F5F5F500; padding: 4px; margin: 4px 0;"></div>'));
          return false;
        }
      });
    });
  });
}, window.jQuery);