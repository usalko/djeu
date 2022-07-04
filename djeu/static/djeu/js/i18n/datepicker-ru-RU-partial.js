/* Russian (UTF-8) initialisation for the jQuery UI date picker plugin. */
/* Written by Andrew Stromnov (stromnov@gmail.com). */
(function (factory) {
	if (typeof define === "function" && define.amd) {

		// AMD. Register as an anonymous module.
		define(["../widgets/datepicker"], factory);
	} else {

		// Browser globals
		factory(jQuery.datepicker);
	}
}(function (datepicker) {

	datepicker.regional.ru = {
		closeText: "Закрыть",
		prevText: "&#x3C;Пред",
		nextText: "След&#x3E;",
		currentText: "Сегодня",
		monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
			"Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
		],
		monthNamesShort: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн",
			"Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"
		],
		dayNames: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
		dayNamesShort: ["вск", "пнд", "втр", "срд", "чтв", "птн", "сбт"],
		dayNamesMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
		weekHeader: "Нед",
		dateFormat: "dd.mm.yy",
		firstDay: 1,
		isRTL: false,
		showMonthAfterYear: false,
		yearSuffix: ""
	};
	datepicker.setDefaults(datepicker.regional.ru);

	Object.getPrototypeOf(datepicker)._possibleChars = function (format) {
		var chars = '';
		var literal = false;
		// Check whether a format character is doubled
		var lookAhead = function (match) {
			var matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) == match);
			if (matches)
				iFormat++;
			return matches;
		};
		for (var iFormat = 0; iFormat < format.length; iFormat++)
			if (literal)
				if (format.charAt(iFormat) == "'" && !lookAhead("'"))
					literal = false;
				else
					chars += format.charAt(iFormat);
			else
				switch (format.charAt(iFormat)) {
					case 'd':
					case 'm':
					case 'y':
					case '@':
						chars += '_0123456789';
						break;
					case 'D':
					case 'M':
						return null; // Accept anything
					case "'":
						if (lookAhead("'"))
							chars += "'";
						else
							literal = true;
						break;
					default:
						chars += format.charAt(iFormat);
				}
		return chars;
	}

	datepicker.wrappedParseDate = Object.getPrototypeOf(datepicker).parseDate;
	Object.getPrototypeOf(datepicker).parseDate = function (format, value, settings) {
		// var julianDate = value.match(/([^\(]+)\(/)[1].trim();
		var result = datepicker.wrappedParseDate(format,
			value
				.replace('____', '1900')
				.replace('__', '01')
				.replace('_', '0'),
			settings);
		return result;
	}

	datepicker.wrappedFormatDate = Object.getPrototypeOf(datepicker).formatDate;
	Object.getPrototypeOf(datepicker).formatDate = function (format, date, settings) {
		var dateValue = datepicker.wrappedFormatDate(format, date, settings);
		return `${dateValue}`;
	}

	return datepicker.regional.ru;

}));