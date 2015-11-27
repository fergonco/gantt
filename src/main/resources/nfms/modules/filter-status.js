define([ "message-bus", "task-tree", "message-bus", "d3" ], function(bus, taskTree, bus) {

	var currentStatus = null;
	var status = [];

	var FILTER_STATUS = function(task) {
		return task.getStatus() == currentStatus || task.hasOwnProperty("tasks");
	};

	var input = d3.select("body").append("select").on("change", function() {
		currentStatus = input.node().value;
		bus.send("filter", [ FILTER_STATUS ]);
	});

	bus.listen("data-ready", function() {
		taskTree.visitTasks(taskTree.ROOT, taskTree.FILTER_ALL, taskTree.VISIT_ALL_CHILDREN,
				function(task) {
					var taskStatus = task.getStatus();
					if (status.indexOf(taskStatus) == -1) {
						status.push(taskStatus);
						input.append("option")//
						.attr("value", taskStatus)//
						.html(taskStatus);
					}
				});

	});

});