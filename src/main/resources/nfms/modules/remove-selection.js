define([ "message-bus", "task-tree", "d3" ], function(bus, taskTree) {

	var selectedNames;

	bus.listen("keypress", function(e, d3Event) {
		if (d3Event.keyCode == 46) {
			try {
				taskTree.visitTasks(taskTree.ROOT, taskTree.FILTER_ALL,
						taskTree.VISIT_ALL_CHILDREN, function(task) {
							if (task.hasOwnProperty("tasks")) {
								for (var i = 0; i < task.tasks.length; i++) {
									if (task.tasks[i].taskName == selectedNames[0]) {
										task.tasks.splice(i, 1);
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
		selectedNames = newSelectedNames;
	});
});