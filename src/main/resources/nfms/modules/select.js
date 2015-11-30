define([ "message-bus", "task-tree", "d3" ], function(bus, taskTree) {

	var taskNames;
	var selectedIndices;

	var getSelectedNames = function() {
		var selectedNames = [];
		if (selectedIndices.length > 0) {
			selectedNames.push(taskNames[selectedIndices[0]]);
		}

		return selectedNames;
	}

	var updateSelection = function() {
		var selectedNames = getSelectedNames();
		console.log(selectedNames);
		var selectedTasksJoin = d3.select(".gantt-chart").selectAll(".taskSelection").data(
				selectedNames);
		selectedTasksJoin.exit().remove();
		selectedTasksJoin.enter().append("rect", ":first-child");
		var x1 = taskTree.getXScale()(taskTree.getTimeDomain()[0]);
		var x2 = taskTree.getXScale()(taskTree.getTimeDomain()[1]);
		var y1 = taskTree.getYScale()(selectedNames[0]);
		selectedTasksJoin.attr("class", "taskSelection")//
		.attr("y", 0)//
		.attr("transform", function(d) {
			var dates = taskTree.getDates(taskTree.getTask(d));
			return "translate(" + x1 + "," + y1 + ")";
		})//
		.attr("width", x2 - x1)//
		.attr("height", taskTree.getYScale().rangeBand());
	};

	bus.listen("keypress", function(e, d3Event) {
		if (d3Event.keyCode == 40 || d3Event.keyCode == 38) {
			if (d3Event.keyCode == 40) {
				d3Event.preventDefault();
				if (selectedIndices.length == 0) {
					selectedIndices = [ 0 ];
				} else {
					selectedIndices[0] = selectedIndices[0] + 1;
				}
			} else if (d3Event.keyCode == 38) {
				d3Event.preventDefault();
				if (selectedIndices.length == 0) {
					selectedIndices = [ taskNames.length - 1 ];
				} else {
					selectedIndices[0] = selectedIndices[0] - 1;
				}
			}
			bus.send("selection-update", [ getSelectedNames() ]);
			updateSelection();
		}
	});
	bus.listen("data-ready", function() {
		selectedIndices = [];
		bus.send("selection-update", [ getSelectedNames() ]);
		taskNames = taskTree.getTaskNames();
		updateSelection();
	});

});