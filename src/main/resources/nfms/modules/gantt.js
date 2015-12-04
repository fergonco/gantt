define([ "utils", "message-bus", "task-tree", "d3" ], function(utils, bus, taskTree) {
	var margin;
	var height;
	var width;
	var svg;

	var timeDomain;
	var taskNames;
	var xScale;
	var yScale;
	var statusList;

	var getWeekends = function(timeDomain) {
		var ret = [];
		var startDate = timeDomain[0];
		var daysUntilSaturday = 6 - startDate.getDay();
		var firstSaturday = new Date(startDate.getTime() + daysUntilSaturday * utils.DAY_MILLIS);
		while (firstSaturday < timeDomain[1]) {
			ret.push(firstSaturday);
			firstSaturday = new Date(firstSaturday.getTime() + 7 * utils.DAY_MILLIS);
		}

		return ret;
	};

	margin = {
		top : 30,
		right : 40,
		bottom : 20,
		left : 450
	};
	height = 1200;// document.body.clientHeight - margin.top -
	// margin.bottom- 5;
	width = 800;// document.body.clientWidth - margin.right - margin.left -
	// 5;

	d3.select("body").append("div").attr("class", "allscreen");
	svg = d3.select(".allscreen").append("svg")//
	.attr("class", "chart")//
	.attr("width", width + margin.left + margin.right)//
	.attr("height", height + margin.top + margin.bottom)//
	.append("g")//
	.attr("class", "gantt-chart")//
	.attr("width", width + margin.left + margin.right)//
	.attr("height", height + margin.top + margin.bottom)//
	.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

	var drag = d3.behavior.drag().on("drag", function() {
		var node = d3.select(this).node().parentNode;
		node.scrollTop = node.scrollTop - d3.event.dy;
	});
	d3.select("body").select(".chart").call(drag);
	var updateTask = function(selection) {
		selection//
		.attr("title", function(d) {
			return d;
		})//
		.attr("rx", 5)//
		.attr("ry", 5)//
		.attr("class", function(d) {
			var task = taskTree.getTask(d);
			var barClass = task.getStatus();
			if (task.isAtemporal()) {
				barClass = "atemporal";
			} else if (barClass == "gruppe") {
				if (task.hasOwnProperty("folded") && task.folded == true) {
					barClass = "gruppe-closed";
				}
			}
			return "tasks bar-" + barClass;
		}) //
		.attr("y", 0)//
		.attr("transform", function(d) {
			var dates = taskTree.getDates(taskTree.getTask(d));
			return "translate(" + xScale(dates[0]) + "," + yScale(d) + ")";
		})//
		.attr("height", function(d) {
			return yScale.rangeBand();
		})//
		.attr("width", function(d) {
			var dates = taskTree.getDates(taskTree.getTask(d));
			return (xScale(dates[1]) - xScale(dates[0]));
		}).on("click", function(d) {
			if (d3.event.defaultPrevented)
				return; // click suppressed
			var task = taskTree.getTask(d);
			bus.send("select-task", [ d ]);
			if (task.hasOwnProperty("tasks")) {
				bus.send("toggle-folded-selected");
			} else if (d3.event.ctrlKey) {
				var statusList = taskTree.getStatusList();
				var taskStatus = task.getStatus();
				for (var i = 0; i < statusList.length; i++) {
					if (taskStatus == statusList[i]) {
						task.status = statusList[(i + 1) % statusList.length];
						updateTask(d3.select(this));
						break;
					}
				}
			}
		});

	};

	var updateTaskHandlers = function(selection) {
		var handleWidth = 5;
		selection//
		.attr("rx", 5)//
		.attr("ry", 5)//
		.attr("class", "taskdates") //
		.attr("y", 0)//
		.attr("transform", function(d) {
			var task = taskTree.getTask(d.taskName);
			var dates = taskTree.getDates(task);
			var x = xScale(dates[d.dateIndex]);
			if (d.dateIndex == 1) {
				x -= handleWidth;
			}
			return "translate(" + x + "," + yScale(d.taskName) + ")";
		})//
		.attr("height", function(d) {
			return yScale.rangeBand();
		})//
		.attr("width", handleWidth);
	}

	bus.listen("data-ready", function() {
		timeDomain = taskTree.getTimeDomain();
		taskNames = taskTree.getTaskNames();
		xScale = taskTree.getXScale();
		yScale = taskTree.getYScale();
		var yRange = yScale.range();
		height = (yRange[1] - yRange[0] + 1) * (1 + taskNames.length) + 30;
		d3.select(".chart").attr("height", height);
		d3.select(".chart g").attr("height", height);

		// Weekends
		var dayX = function(d) {
			return xScale(d);
		};
		var dayY = function(d) {
			return 0;
		};
		var dayHeight = function(d) {
			return height - margin.top - margin.bottom;
		};
		var saturdays = getWeekends(timeDomain);
		var weekendSelection = svg.selectAll(".weekend").data(saturdays);
		weekendSelection.exit().remove();
		weekendSelection.enter().insert("rect", ":first-child");
		weekendSelection.attr("class", "weekend").attr("x", dayX).attr("y", dayY).attr("width",
				function(d) {
					return xScale(new Date(d.getTime() + 2 * utils.DAY_MILLIS)) - xScale(d);
				}).attr("height", dayHeight);

		// Tasks
		var taskSelection = svg.selectAll(".tasks").data(taskNames);
		taskSelection.exit().remove();
		taskSelection.enter().append("rect");

		updateTask(taskSelection);

		// drag&drop tasks
		var dx;
		var sourceX;
		var drag = d3.behavior.drag().on("dragstart", function(d) {
			var task = taskTree.getTask(d);
			dx = 0;
			sourceX = xScale(task.getStartDate());
		}).on("drag", function(d) {
			dx += d3.event.dx;
			var task = taskTree.getTask(d);
			var length = task.getEndDate().getTime() - task.getStartDate().getTime();
			var newStartDate = xScale.invert(sourceX + dx);
			task.startDate = utils.formatDate(newStartDate);
			task.endDate = utils.formatDate(new Date(newStartDate.getTime() + length));

			updateTask(d3.select(this));
			updateTaskHandlers(d3.selectAll(".taskdates").filter(function(d2) {
				return d2.taskName == d;
			}));
		}).on("dragend", function(d) {
			if (dx != 0) {
				bus.send("refresh-tree");
			}
		});
		taskSelection.call(drag);

		// Tasks date handlers
		var taskDates = [];
		for (var i = 0; i < taskNames.length; i++) {
			taskDates.push({
				"taskName" : taskNames[i],
				"dateIndex" : 0
			});
			taskDates.push({
				"taskName" : taskNames[i],
				"dateIndex" : 1
			});
		}
		var taskDatesSelection = svg.selectAll(".taskdates").data(taskDates);
		taskDatesSelection.exit().remove();
		taskDatesSelection.enter().append("rect");

		updateTaskHandlers(taskDatesSelection);

		// drag&drop task date handlers
		drag = d3.behavior.drag().on("dragstart", function(d) {
			var task = taskTree.getTask(d.taskName);
			dx = 0;
			if (d.dateIndex == 0) {
				sourceX = xScale(task.getStartDate());
			} else {
				sourceX = xScale(task.getEndDate());
			}
		}).on("drag", function(d) {
			dx += d3.event.dx;
			var task = taskTree.getTask(d.taskName);
			var newDate = xScale.invert(sourceX + dx);
			if (d.dateIndex == 0) {
				task.startDate = utils.formatDate(newDate);
			} else {
				task.endDate = utils.formatDate(newDate);
			}
			updateTaskHandlers(d3.select(this));
			updateTask(d3.selectAll(".tasks").filter(function(d2) {
				return d2 == d.taskName;
			}));
		}).on("dragend", function(d) {
			bus.send("refresh-tree");
		});
		taskDatesSelection.call(drag);

		// Today
		var todaySelection = svg.selectAll(".today").data([ utils.today ]);
		todaySelection.exit().remove();
		todaySelection.enter().append("rect");
		todaySelection.attr("class", "today").attr("x", dayX).attr("y", dayY).attr("width",
				function(d) {
					return xScale(new Date(d.getTime() + utils.DAY_MILLIS)) - xScale(d);
				}).attr("height", dayHeight);

		// Axis
		svg.selectAll(".axis").remove();

		var yAxis = d3.svg.axis().scale(yScale).orient("left").tickSize(1);
		svg.append("g").attr("class", "y axis").call(yAxis);
		var xAxis1 = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(
				d3.time.format("%d/%m")).tickSize(1).tickPadding(8);
		svg.append("g").attr("class", "x axis").attr("transform",
				"translate(0, " + (height - margin.top - margin.bottom) + ")").call(xAxis1);
		var xAxis2 = d3.svg.axis().scale(xScale).orient("top").tickFormat(d3.time.format("%d/%m"))
				.tickSize(1).tickPadding(8);
		svg.append("g").attr("class", "x axis").call(xAxis2);

		var zoom = d3.behavior.zoom();
		svg.call(zoom);

		bus.send("gantt-created", [ svg ]);
	});
});