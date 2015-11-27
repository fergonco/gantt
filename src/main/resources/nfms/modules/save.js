define([ "message-bus", "d3" ], function(bus) {

	d3.select("body").append("input")//
	.attr("type", "button")//
	.attr("value", "Guardar").on("click", function() {
		bus.send("save");
	});

});