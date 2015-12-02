define([ "message-bus", "task-tree" ], function(bus, taskTree) {

	var selectedTaskName;

	bus.listen("keypress", function(e, d3Event) {
		if (d3Event.keyCode == 32 && selectedTaskName != null) {
			bus.send("toggle-folded-selected");
		}
	});

	bus.listen("toggle-folded-selected", function() {
		var task = taskTree.getTask(selectedTaskName);
		var folded;
		if (task.hasOwnProperty("folded")) {
			folded = task.folded;
		} else {
			folded = false;
		}
		folded = !folded;
		task["folded"] = folded;
		bus.send("refresh-tree");
	});

	bus.listen("selection-update", function(e, newSelectedName) {
		selectedTaskName = newSelectedName;
	});
});
