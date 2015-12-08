define([ "message-bus", "task-tree" ], function(bus, taskTree) {

	bus.listen("gantt-created", function() {
		var taskNames = [];
		taskTree.visitTasks(taskTree.ROOT, function(task) {
			return task.getContent() != "";
		}, taskTree.VISIT_UNFOLDED_CHILDREN, function(task) {
			taskNames.push(task.taskName);
		});
		var selection = d3.select(".gantt-chart").selectAll(".taskContentIndicator").data(taskNames);
		selection.exit().remove();
		selection.enter().append("rect");

		var size = taskTree.getYScale().rangeBand() / 2;
		selection.attr("class", "taskContentIndicator")//
		.attr("x", function(d) {
			var dates = taskTree.getDates(taskTree.getTask(d));
			return taskTree.getXScale()(dates[1]) - size;
		})//
		.attr("y", function(d) {
			return taskTree.getYScale()(d) + taskTree.getYScale().rangeBand() / 4;
		})//
		.attr("width", size)//
		.attr("height", size);

	});
});
