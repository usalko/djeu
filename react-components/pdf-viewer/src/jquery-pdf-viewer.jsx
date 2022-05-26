import PDFwrapper from "./components/PDFwrapper";
import ReactDOM from 'react-dom';
import "./styles/index.css";
import jQuery from 'jquery';

if (typeof jQuery !== 'undefined') {
    (function ($) {
        var pluginName = "pdfViewer",
            defaults = {
                value: 0
            };

        function Plugin(element, options) {
            this.element = element;
            this.settings = $.extend({}, defaults, options);
            this._defaults = defaults;
            this._name = pluginName;
            this.init();
        }

        $.extend(Plugin.prototype, {
            init: function () {
                this.component = ReactDOM.render(
                    <PDFwrapper url={this.settings.url} highlights={this.settings.highlights} />,
                    this.element
                );
                return this;
            },

            url: function (url) {
                if (!arguments.length) {
                    return this.component.state.url;
                } else {
                    this.settings.url = url;
                    this.init();
                }
            },

            highlights: function (highlights) {
                if (!arguments.length) {
                    return this.component.state.highlights;
                } else {
                    this.settings.highlights = highlights;
                    this.init();
                }
            },

        });

        $.fn[pluginName] = function (options) {
            return this.map(function () {
                if (!$.data(this, 'plugin_'+pluginName)) {
                    $.data(this, 'plugin_'+pluginName, new Plugin(this, options));
                }
                return $.data(this, 'plugin_'+pluginName);
            });
        };
    })(jQuery);

}