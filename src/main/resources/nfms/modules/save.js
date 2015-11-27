define([ "message-bus", "d3" ], function(bus) {

	d3.select("body").on("click", function() {
		bus.send("save");
	});

});