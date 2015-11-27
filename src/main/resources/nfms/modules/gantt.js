define([ "utils", "message-bus", "task-tree", "d3" ], function(utils, bus, taskTree) {
	var margin;
	var height;
	var width;
	var svg;

	var xScale;
	var yScale;

	var FILTER_WITH_DATE = function(task) {
		return !task.hasOwnProperty("tasks");
	};

	var getDates = function(task) {
		var min = null;
		var max = null;
		var timeDomain = taskTree.visitTasks(task, FILTER_WITH_DATE, taskTree.VISIT_ALL_CHILDREN,
				function(task) {
					if (min == null || min > task.getStartDate()) {
						min = task.getStartDate();
					}
					if (max == null || max < task.getEndDate()) {
						max = task.getEndDate();
					}
				});
		return [ min, max ];
	}

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

	d3.select("body").append("div").attr("class", "outer")//
	.attr("width", width).attr("height", "99%");
	svg = d3.select(".outer").append("svg")//
	.attr("class", "chart")//
	.attr("width", width + margin.left + margin.right)//
	.attr("height", height + margin.top + margin.bottom)//
	.append("g")//
	.attr("class", "gantt-chart")//
	.attr("width", width + margin.left + margin.right)//
	.attr("height", height + margin.top + margin.bottom)//
	.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

	var updateTask = function(selection) {
		selection//
		.attr("rx", 5)//
		.attr("ry", 5)//
		.attr("class", function(d) {
			var task = taskTree.getTask(d);
			var status = task.getStatus();
			if (status == "gruppe") {
				if (task.hasOwnProperty("folded") && task.folded == true) {
					status = "gruppe-closed";
				}
			}
			return "tasks bar-" + status;
		}) //
		.attr("y", 0)//
		.attr("transform", function(d) {
			var dates = getDates(taskTree.getTask(d));
			return "translate(" + xScale(dates[0]) + "," + yScale(d) + ")";
		})//
		.attr("height", function(d) {
			return yScale.rangeBand();
		})//
		.attr("width", function(d) {
			var dates = getDates(taskTree.getTask(d));
			return (xScale(dates[1]) - xScale(dates[0]));
		}).on("click", function(d) {
			var task = taskTree.getTask(d);
			if (task.hasOwnProperty("tasks")) {
				var folded;
				if (task.hasOwnProperty("folded")) {
					folded = task.folded;
				} else {
					folded = false;
				}
				folded = !folded;
				task["folded"] = folded;
				bus.send("refresh-tree");
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
			var dates = getDates(task);
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
		var timeDomain = getDates(taskTree.ROOT);
		var taskNames = taskTree.visitTasks(taskTree.ROOT, taskTree.FILTER_ALL,
				taskTree.VISIT_UNFOLDED_CHILDREN, taskTree.NAME_EXTRACTOR);

		height = taskNames.length * 34 + 70;
		d3.select(".chart").attr("height", height);
		d3.select(".chart g").attr("height", height);

		xScale = d3.time.scale().domain(timeDomain).range([ 0, width ]).clamp(false);
		yScale = d3.scale.ordinal().domain(taskNames).rangeRoundBands(
				[ 0, height - margin.top - margin.bottom ], .1);

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
		weekendSelection.enter().append("rect");
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
			bus.send("refresh-tree");
		});
		taskSelection.call(drag);

		// Tasks date handlers
		var taskDates = taskTree.visitTasks(taskTree.ROOT, taskTree.FILTER_ALL,
				taskTree.VISIT_UNFOLDED_CHILDREN, function(task) {
					return [ {
						"taskName" : task.taskName,
						"dateIndex" : 0
					}, {
						"taskName" : task.taskName,
						"dateIndex" : 1
					} ];
				});
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
		svg.append("g").attr("class", "y axis").transition().call(yAxis);
		var xAxis1 = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(
				d3.time.format("%d/%m")).tickSize(1).tickPadding(8);
		svg.append("g").attr("class", "x axis").attr("transform",
				"translate(0, " + (height - margin.top - margin.bottom) + ")").transition().call(
				xAxis1);
		var xAxis2 = d3.svg.axis().scale(xScale).orient("top").tickFormat(d3.time.format("%d/%m"))
				.tickSize(1).tickPadding(8);
		svg.append("g").attr("class", "x axis").transition().call(xAxis2);

		var zoom = d3.behavior.zoom();
		svg.call(zoom);

		bus.send("gantt-created", [ svg ]);
	});
});