define([ "message-bus", "utils", "d3" ], function(bus, utils) {
	var FILTER_TODAY = function(task) {
		return task.getStartDate() <= utils.today && task.getEndDate() >= utils.today;
	};

	d3.select("body").append("input")//
	.attr("type", "button")//
	.attr("value", "Mostrar hoy").on("click", function() {
		bus.send("filter", [ FILTER_TODAY ]);
	});

});