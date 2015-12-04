define([ "text!../plan", "utils", "message-bus", "gantt" ], function(plan, utils, bus) {
	var plan = JSON.parse(plan);

	bus.listen("modules-loaded", function() {
		bus.send("plan", [ plan ]);
	});

});