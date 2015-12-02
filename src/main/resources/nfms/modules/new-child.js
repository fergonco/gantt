define([ "message-bus", "task-tree", "data-reader", "d3" ], function(bus, taskTree, dataReader) {

	var selectedTaskName;

	bus.listen("keypress", function(e, d3Event) {
		if (d3Event.keyCode == 45) {
			var newTaskName = "new task";
			var parentTask = taskTree.getTask(selectedTaskName);
			var newTask = {
				taskName : newTaskName
			};
			if (parentTask.hasOwnProperty("status")) {
				newTask["status"] = parentTask.status;
			}
			if (parentTask.getStartDate() != null) {
				newTask.startDate = parentTask.getStartDate();
			}
			if (parentTask.getEndDate() != null) {
				newTask.endDate = parentTask.getEndDate();
			}
			if (!parentTask.hasOwnProperty("tasks")) {
				parentTask["tasks"] = [];
			}
			dataReader.decorateTask(newTask);
			parentTask.tasks.splice(0, 0, newTask);
			bus.send("refresh-tree");
			bus.send("select-task", [ newTaskName ]);
			bus.send("edit-selected");
		}
	});

	bus.listen("selection-update", function(e, newSelectedName) {
		selectedTaskName = newSelectedName;
	});
});