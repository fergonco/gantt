define([ "message-bus", "task-tree", "d3" ], function(bus, taskTree) {

	var taskNames;
	var selectedIndices;

	var updateSelection = function() {
		var data = [];
		if (selectedIndices.length > 0) {
			data.push(taskNames[selectedIndices[0]]);
		}
		var selectedTasksJoin = d3.select(".gantt-chart").selectAll(".taskSelection").data(data);
		selectedTasksJoin.exit().remove();
		selectedTasksJoin.enter().append("rect", ":first-child");
		var x1 = taskTree.getXScale()(taskTree.getTimeDomain()[0]);
		var x2 = taskTree.getXScale()(taskTree.getTimeDomain()[1]);
		var y1 = taskTree.getYScale()(data[0]);
		selectedTasksJoin.attr("class", "taskSelection")//
		.attr("y", 0)//
		.attr("transform", function(d) {
			var dates = taskTree.getDates(taskTree.getTask(d));
			return "translate(" + x1 + "," + y1 + ")";
		})//
		.attr("width", x2 - x1)//
		.attr("height", taskTree.getYScale().rangeBand());
	};

	d3.select("body").on("keypress", function() {
		if (d3.event.keyCode == 40) {
			d3.event.preventDefault();
			if (selectedIndices.length == 0) {
				selectedIndices = [ 0 ];
			} else {
				selectedIndices[0] = selectedIndices[0] + 1;
			}
		} else if (d3.event.keyCode == 38) {
			d3.event.preventDefault();
			if (selectedIndices.length == 0) {
				selectedIndices = [ taskNames.length - 1 ];
			} else {
				selectedIndices[0] = selectedIndices[0] - 1;
			}
		}

		bus.send("selection-update", [ selectedIndices ]);

		updateSelection();
	});
	bus.listen("data-ready", function() {
		selectedIndices = [];
		taskNames = taskTree.getTaskNames();
		updateSelection();
	});

});