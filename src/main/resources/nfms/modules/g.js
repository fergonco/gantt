define([ "utils", "d3.v3" ], function(utils) {
	var margin;
	var height;
	var width;
	var svg;

	var ROOT = {
		"taskName" : "root",
		"tasks" : null
	}

	var FILTER_ALL = function(task) {
		return task != ROOT;
	};
	var FILTER_WITH_DATE = function(task) {
		return task.hasOwnProperty("startDate") && task.hasOwnProperty("endDate");
	};

	var VISIT_ALL_CHILDREN = function(task) {
		return true;
	};

	var VISIT_UNFOLDED_CHILDREN = function(task) {
		return !task.hasOwnProperty("folded") || !task.folded;
	};

	var NAME_EXTRACTOR = function(task) {
		return task.taskName;
	};

	var visitTasks = function(task, filter, visitChildren, extractor) {
		var ret = [];
		if (filter(task)) {
			ret.push(extractor(task));
		}
		if (task.hasOwnProperty("tasks") && visitChildren(task)) {
			for (var i = 0; i < task.tasks.length; i++) {
				ret = ret.concat(visitTasks(task.tasks[i], filter, visitChildren, extractor));
			}
		}

		return ret;
	}

	var getDates = function(task) {
		var min = null;
		var max = null;
		var timeDomain = visitTasks(task, FILTER_WITH_DATE, VISIT_ALL_CHILDREN, function(task) {
			if (min == null || min > task.startDate) {
				min = task.startDate;
			}
			if (max == null || max < task.endDate) {
				max = task.endDate;
			}
		});
		return [ min, max ];
	}

	var getTask = function(tasks, taskName) {
		var ret = null;
		for (var i = 0; i < tasks.length && ret == null; i++) {
			if (tasks[i].taskName == taskName) {
				ret = tasks[i];
			} else if (tasks[i].hasOwnProperty("tasks")) {
				ret = getTask(tasks[i].tasks, taskName);
			}
		}
		return ret;
	};

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

	var create = function() {
		margin = {
			top : 30,
			right : 40,
			bottom : 20,
			left : 450
		};
		height = 1200;// document.body.clientHeight - margin.top -
		// margin.bottom- 5;
		width = document.body.clientWidth - margin.right - margin.left - 5;

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
	}

	var updateChart = function(plan) {
		ROOT.tasks = plan;
		var timeDomain = getDates(ROOT);
		var taskNames = visitTasks(ROOT, FILTER_ALL, VISIT_UNFOLDED_CHILDREN, NAME_EXTRACTOR);

		height = taskNames.length * 34 + 70;
		d3.select(".chart").attr("height", height);
		d3.select(".chart g").attr("height", height);

		var xScale = d3.time.scale().domain(timeDomain).range([ 0, width ]).clamp(false);
		var yScale = d3.scale.ordinal().domain(taskNames).rangeRoundBands(
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

		taskSelection//
		.attr("rx", 5)//
		.attr("ry", 5)//
		.attr("class", function(d) {
			var task = getTask(plan, d);
			var status = task.status;
			if (status == "gruppe") {
				if (task.hasOwnProperty("folded") && task.folded == true) {
					status = "gruppe-closed";
				}
			}
			return "tasks bar-" + status;
		}) //
		.attr("y", 0)//
		.attr("transform", function(d) {
			var dates = getDates(getTask(plan, d));
			return "translate(" + xScale(dates[0]) + "," + yScale(d) + ")";
		})//
		.attr("height", function(d) {
			return yScale.rangeBand();
		})//
		.attr("width", function(d) {
			var dates = getDates(getTask(plan, d));
			return (xScale(dates[1]) - xScale(dates[0]));
		}).on("click", function(d) {
			var task = getTask(plan, d);
			if (task.hasOwnProperty("tasks")) {
				var folded;
				if (task.hasOwnProperty("folded")) {
					folded = task.folded;
				} else {
					folded = false;
				}
				folded = !folded;
				task["folded"] = folded;
				updateChart(plan);
			}
		});

		// drag&drop tasks
		var dx;
		var sourceX;
		var drag = d3.behavior.drag().on("dragstart", function(d) {
			var task = getTask(plan, d);
			dx = 0;
			sourceX = xScale(task.startDate);
		}).on("drag", function(d) {
			dx += d3.event.dx;
			var task = getTask(plan, d);
			var length = task.endDate.getTime() - task.startDate.getTime();
			var newDate = xScale.invert(sourceX + dx);
			newDate.setHours(0);
			newDate.setMinutes(0);
			newDate.setMilliseconds(0);
			task.startDate = newDate;
			task.endDate = new Date(newDate.getTime() + length);
			updateChart(plan);
		});
		taskSelection.call(drag);

		// Tasks date handlers
		var taskDates = [];
		for (var i = 0; i < taskNames.length; i++) {
			var task = getTask(plan, taskNames[i]);
			taskDates.push({
				"taskName" : task.taskName,
				"dateIndex" : 0
			});
			taskDates.push({
				"taskName" : task.taskName,
				"dateIndex" : 1
			});
		}
		var taskDatesSelection = svg.selectAll(".taskdates").data(taskDates);
		taskDatesSelection.exit().remove();
		taskDatesSelection.enter().append("rect");

		var handleWidth = 5;
		taskDatesSelection//
		.attr("rx", 5)//
		.attr("ry", 5)//
		.attr("class", "taskdates") //
		.attr("y", 0)//
		.attr("transform", function(d) {
			var dates = getDates(getTask(plan, d.taskName));
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

		// drag&drop task date handlers
		drag = d3.behavior.drag().on("dragstart", function(d) {
			var task = getTask(plan, d.taskName);
			dx = 0;
			if (d.dateIndex == 0) {
				sourceX = xScale(task.startDate);
			} else {
				sourceX = xScale(task.endDate);
			}
		}).on("drag", function(d) {
			dx += d3.event.dx;
			var task = getTask(plan, d.taskName);
			var newDate = xScale.invert(sourceX + dx);
			newDate.setHours(0);
			newDate.setMinutes(0);
			newDate.setMilliseconds(0);
			if (d.dateIndex == 0) {
				task.startDate = newDate;
			} else {
				task.endDate = newDate;
			}
			updateChart(plan);
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
		svg.append("g").attr("class", "x axis").call(xAxis2);

		var zoom = d3.behavior.zoom();
		svg.call(zoom);
	}

	return {
		"create" : create,
		"updateChart" : updateChart
	};
});