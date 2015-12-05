define([ "message-bus", "task-tree", "d3" ], function(bus, taskTree) {

	var selectedTaskName;

	bus.listen("keypress", function(e, d3Event) {
		if (d3Event.keyCode == 45) {
			var newTaskName = "new task";
			var parentTask = taskTree.getTask(selectedTaskName);
			parentTask.createChild(newTaskName, d3Event.shiftKey);
			bus.send("refresh-tree");
			bus.send("select-task", [ newTaskName ]);
			bus.send("edit-selected");
		}
	});

	bus.listen("selection-update", function(e, newSelectedName) {
		selectedTaskName = newSelectedName;
	});
});