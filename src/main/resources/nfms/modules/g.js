define([ "utils", "d3.v3" ], function(utils) {
	var margin;
	var height;
	var width;
	var svg;
	var nameIndicesMap = {};

	var xScale;
	var yScale;

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
		return visitTasksWithIndex(task, [], filter, visitChildren, extractor);
	}

	var visitTasksWithIndex = function(task, index, filter, visitChildren, extractor) {
		var ret = [];
		if (filter(task)) {
			ret = ret.concat(extractor(task, index));
		}
		if (task.hasOwnProperty("tasks") && visitChildren(task)) {
			for (var i = 0; i < task.tasks.length; i++) {
				ret = ret.concat(visitTasksWithIndex(task.tasks[i], index.concat([ i ]), filter,
						visitChildren, extractor));
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

	var getTask = function(root, taskName) {
		var taskIndices = nameIndicesMap[taskName];
		var ret = root;
		for (var i = 0; i < taskIndices.length; i++) {
			ret = ret.tasks[taskIndices[i]];
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
	};

	var updateTask = function(selection) {
		selection//
		.attr("rx", 5)//
		.attr("ry", 5)//
		.attr("class", function(d) {
			var task = getTask(ROOT, d);
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
			var dates = getDates(getTask(ROOT, d));
			return "translate(" + xScale(dates[0]) + "," + yScale(d) + ")";
		})//
		.attr("height", function(d) {
			return yScale.rangeBand();
		})//
		.attr("width", function(d) {
			var dates = getDates(getTask(ROOT, d));
			return (xScale(dates[1]) - xScale(dates[0]));
		}).on("click", function(d) {
			var task = getTask(ROOT, d);
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

	};

	var updateTaskHandlers = function(selection) {
		var handleWidth = 5;
		selection//
		.attr("rx", 5)//
		.attr("ry", 5)//
		.attr("class", "taskdates") //
		.attr("y", 0)//
		.attr("transform", function(d) {
			var task = getTask(ROOT, d.taskName);
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

	var updateChart = function(plan) {
		ROOT.tasks = plan;
		var timeDomain = getDates(ROOT);
		var taskNames = visitTasks(ROOT, FILTER_ALL, VISIT_UNFOLDED_CHILDREN, NAME_EXTRACTOR);
		var taskIndices = visitTasks(ROOT, FILTER_ALL, VISIT_UNFOLDED_CHILDREN, function(task,
				index) {
			nameIndicesMap[task.taskName] = index;
		});

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
			var task = getTask(ROOT, d);
			dx = 0;
			sourceX = xScale(task.startDate);
		}).on("drag", function(d) {
			dx += d3.event.dx;
			var task = getTask(ROOT, d);
			var length = task.endDate.getTime() - task.startDate.getTime();
			var newDate = xScale.invert(sourceX + dx);
			newDate.setHours(0);
			newDate.setMinutes(0);
			newDate.setMilliseconds(0);
			task.startDate = newDate;
			task.endDate = new Date(newDate.getTime() + length);
			updateTask(d3.select(this));
			updateTaskHandlers(d3.selectAll(".taskdates").filter(function(d2) {
				return d2.taskName == d;
			}));
		}).on("dragend", function(d) {
			updateChart(plan);
		});
		taskSelection.call(drag);

		// Tasks date handlers
		var taskDates = visitTasks(ROOT, FILTER_ALL, VISIT_UNFOLDED_CHILDREN, function(task) {
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
			var task = getTask(ROOT, d.taskName);
			dx = 0;
			if (d.dateIndex == 0) {
				sourceX = xScale(task.startDate);
			} else {
				sourceX = xScale(task.endDate);
			}
		}).on("drag", function(d) {
			dx += d3.event.dx;
			var task = getTask(ROOT, d.taskName);
			var newDate = xScale.invert(sourceX + dx);
			newDate.setHours(0);
			newDate.setMinutes(0);
			newDate.setMilliseconds(0);
			if (d.dateIndex == 0) {
				task.startDate = newDate;
			} else {
				task.endDate = newDate;
			}
			updateTaskHandlers(d3.select(this));
			updateTask(d3.selectAll(".tasks").filter(function(d2) {
				return d2 == d.taskName;
			}));
		}).on("dragend", function(d) {
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
		svg.selectAll(".y.axis .tick").on("click", function(d) {
			var tickSelection = d3.select(this);
			var input = tickSelection.append("foreignObject")//
			.attr("width", "300px")//
			.attr("height", "25px")//
			.attr("class", "editable")//
			.append("xhtml:form").append("input").attr("value", function() {
				// nasty spot to place this call, but here we are sure that the
				// <input> tag is available
				// and is handily pointed at by 'this':
				this.focus();

				return d;
			}).attr("style", "width: 294px;")
			// make the form go away when you jump out (form looses focus) or
			// hit ENTER:
			.on("blur", function() {
				getTask(ROOT, d).taskName = input.node().value;
				// Note to self: frm.remove() will remove the entire <g> group!
				// Remember the D3 selection logic!
				tickSelection.select(".editable").remove();
				updateChart(plan);
			}).on("keypress", function() {
				// IE fix
				if (!d3.event)
					d3.event = window.event;

				var e = d3.event;
				if (e.keyCode == 13) {
					input.node().blur();
					// if (typeof (e.cancelBubble) !== 'undefined') // IE
					// e.cancelBubble = true;
					// if (e.stopPropagation)
					// e.stopPropagation();
					// e.preventDefault();
					//
					// var txt = inp.node().value;
					//
					// d[field] = txt;
					// el.text(function(d) {
					// return d[field];
					// });
					//
					// // odd. Should work in Safari, but the debugger crashes
					// on
					// // this instead.
					// // Anyway, it SHOULD be here and it doesn't hurt
					// otherwise.
					// p_el.select("foreignObject").remove();
				}
			});
		});
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
	}

	return {
		"create" : create,
		"updateChart" : updateChart
	};
});