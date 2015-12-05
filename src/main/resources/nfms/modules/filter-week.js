define(
		[ "message-bus", "utils", "d3" ],
		function(bus, utils) {

			var weekStart = new Date(utils.today.getTime());
			weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
			var weekEnd = new Date(weekStart.getTime() + utils.DAY_MILLIS * 6);

			var FILTER_WEEK = function(task) {
				return task.isGroup()
						|| ((task.getEndDate() >= weekStart && task.getEndDate() <= weekEnd)
								|| (task.getStartDate() >= weekStart && task.getStartDate() <= weekEnd) || (task
								.getStartDate() < weekStart && task.getEndDate() > weekEnd));
			};

			d3.select("body").append("input")//
			.attr("type", "button")//
			.attr("value", "Mostrar semana").on("click", function() {
				bus.send("filter", [ FILTER_WEEK ]);
			});

		});