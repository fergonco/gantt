define([ "message-bus", "d3" ], function(bus) {
	var enabled = true;
	bus.listen("disable-keylistener", function() {
		enabled = false;
	});
	bus.listen("enable-keylistener", function() {
		enabled = true;
	});
	d3.select("body").on("keyup", function() {
		if (enabled && !d3.event.cancelBubble) {
			bus.send("keypress", [ d3.event ]);
		}
	});
});