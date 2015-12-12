define([ "message-bus", "utils", "d3" ], function(bus, utils) {
	var FILTER_TODAY = function(task) {
		return task.isGroup()
				|| (task.getStartDate() <= utils.today && task.getEndDate() >= utils.today);
	};

	d3.select("body").append("div")//
	.attr("class", "button")//
	.html("Mostrar hoy").on("click", function() {
		bus.send("filter", [ FILTER_TODAY ]);
	});

});