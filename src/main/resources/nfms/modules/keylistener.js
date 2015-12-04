define([ "message-bus", "d3" ], function(bus) {

	var enabled = true;
	bus.listen("disable-keylistener", function() {
		enabled = false;
	});
	bus.listen("enable-keylistener", function() {
		enabled = true;
	});
	document.onkeyup = function(e) {
		if (enabled) {
			bus.send("keypress", [ e ]);
		}
	};

});