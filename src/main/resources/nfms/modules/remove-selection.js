define([ "message-bus", "task-tree", "d3" ], function(bus, taskTree) {

	var selectedTaskName;

	bus.listen("keypress", function(e, d3Event) {
		if (d3Event.keyCode == 46) {
			var task = taskTree.getTask(selectedTaskName);
			task.getParent().removeChild(task);
			bus.send("refresh-tree");
		}
	});

	bus.listen("selection-update", function(e, newSelectedName) {
		selectedTaskName = newSelectedName;
	});
});