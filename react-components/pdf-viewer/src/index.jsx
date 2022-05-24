import React from 'react';
// import ReactDOM from 'react-dom';
import {App} from './components/App';
import "./styles/index.css";


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

                this.component = React.render(

                    <App value={this.settings.value} />,

                    this.element

                );

                return this;

            },

     

            val: function (val) {

                if (!arguments.length) {

                    return this.component.state.counter;

                }else{

                    this.settings.value = val;

                    this.init();

                }

            }

        });

    })(jQuery);


}
