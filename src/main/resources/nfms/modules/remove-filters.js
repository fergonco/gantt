define([ "message-bus", "utils", "d3" ], function(bus, utils) {
	d3.select("body").append("input")//
	.attr("type", "button")//
	.attr("value", "Quitar filtros").on("click", function() {
		bus.send("filter", [ null ]);
	});

});