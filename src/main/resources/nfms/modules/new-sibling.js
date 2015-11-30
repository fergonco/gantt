define([ "message-bus", "task-tree", "data-reader", "d3" ], function(bus, taskTree, dataReader) {

	var selectedTaskNames;

	bus.listen("keypress", function(e, d3Event) {
		if (d3Event.keyCode == 13) {
			try {
				taskTree.visitTasks(taskTree.ROOT, taskTree.FILTER_ALL,
						taskTree.VISIT_ALL_CHILDREN, function(task) {
							if (task.hasOwnProperty("tasks")) {
								for (var i = 0; i < task.tasks.length; i++) {
									if (task.tasks[i].taskName == selectedTaskNames[0]) {
										var newTask = {
											taskName : "new task",
											status : task.tasks[i].status
										};
										dataReader.decorateTask(newTask);
										var index = i + 1;
										if (d3Event.shiftKey) {
											index = i;
										}
										task.tasks.splice(index, 0, newTask);
										throw "stop";
									}
								}
							}
						});
			} catch (e) {
				if (e == "stop") {
					bus.send("refresh-tree");
				} else {
					throw e;
				}
			}
		}
	});

	bus.listen("selection-update", function(e, newSelectedNames) {
		selectedTaskNames = newSelectedNames;
	});
});