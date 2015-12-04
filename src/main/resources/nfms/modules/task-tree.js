define([ "message-bus", "utils" ], function(bus, utils) {

	var nameIndicesMap = {};
	var timeDomain = null;
	var userFilter = null;
	var userChildrenFilter = null;
	var xScale;
	var yScale;
	var taskNames;
	var statusList;

	var ROOT = {
		"taskName" : "root",
		"tasks" : null,
		"getParent" : function() {
			return null;
		},
		"isAtemporal" : function() {
			return false;
		}
	}

	var FILTER_ALL = function(task) {
		return task != ROOT;
	};

	var FILTER_WITH_DATE = function(task) {
		return !task.hasOwnProperty("tasks");
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
		return visitTasksWithIndex(null, task, [], filter, visitChildren, extractor);
	}

	var visitTasksWithIndex = function(parent, task, index, filter, visitChildren, extractor) {
		var ret = [];
		if (filter(task) && (userFilter == null || userFilter(task))) {
			ret = ret.concat(extractor(task, index, parent));
		}
		if (task.hasOwnProperty("tasks") && visitChildren(task)) {
			for (var i = 0; i < task.tasks.length; i++) {
				ret = ret.concat(visitTasksWithIndex(task, task.tasks[i], index.concat([ i ]),
						filter, visitChildren, extractor));
			}
		}

		return ret;
	}

	var getDates = function(task) {
		var min = null;
		var max = null;
		var timeDomain = visitTasks(task, FILTER_WITH_DATE, VISIT_ALL_CHILDREN, function(task) {
			if (min == null || min > task.getStartDate()) {
				min = task.getStartDate();
			}
			if (max == null || max < task.getEndDate()) {
				max = task.getEndDate();
			}
		});
		return [ min, max ];
	}

	var getTask = function(taskName) {
		var taskIndices = nameIndicesMap[taskName];
		var ret = ROOT;
		for (var i = 0; i < taskIndices.length; i++) {
			ret = ret.tasks[taskIndices[i]];
		}
		return ret;
	};

	var decorateTask = function(parent, task) {
		task["getParent"] = function() {
			return parent;
		}
		task["isAtemporal"] = function() {
			if (task.getParent() == null) {
				return false;
			} else {
				return task.getParent()["atemporal-children"] || task.getParent().isAtemporal();
			}
		}
		task["getStatus"] = function() {
			if (task.hasOwnProperty("tasks") && !task["atemporal-children"]) {
				return "gruppe";
			} else if (task.hasOwnProperty("status")) {
				return task.status;
			} else {
				return "short";
			}
		}
		task["getStartDate"] = function() {
			if (task.isAtemporal()) {
				var parentDate = task.getParent().getStartDate();
				return new Date(parentDate.getTime() + utils.DAY_MILLIS);
			} else if (!task.hasOwnProperty("tasks") || task["atemporal-children"]) {
				if (task.hasOwnProperty("startDate")) {
					return new Date(task["startDate"]);
				} else {
					return utils.today;
				}
			} else {
				return null;
			}
		};
		task["getEndDate"] = function() {
			if (task.isAtemporal()) {
				var parentDate = task.getParent().getEndDate();
				return new Date(parentDate.getTime() + 2 * utils.DAY_MILLIS);
			} else if (!task.hasOwnProperty("tasks") || task["atemporal-children"]) {
				if (task.hasOwnProperty("endDate")) {
					return new Date(task["endDate"]);
				} else {
					return new Date(utils.today.getTime() + utils.DAY_MILLIS);
				}
			} else {
				return null;
			}
		};
	}

	bus.listen("refresh-tree", function(e) {
		visitTasks(ROOT, FILTER_ALL, VISIT_ALL_CHILDREN, function(task, index, parent) {
			decorateTask(parent, task);
		});
		timeDomain = getDates(ROOT);
		var childrenFilter = userChildrenFilter != null ? VISIT_ALL_CHILDREN
				: VISIT_UNFOLDED_CHILDREN;
		visitTasks(ROOT, FILTER_ALL, childrenFilter, function(task, index) {
			nameIndicesMap[task.taskName] = index;
		});
		taskNames = visitTasks(ROOT, FILTER_ALL, childrenFilter, NAME_EXTRACTOR);
		xScale = d3.time.scale().domain(timeDomain).range([ 0, 800 ]).clamp(false);
		yScale = d3.scale.ordinal().domain(taskNames).rangeRoundBands([ 0, taskNames.length * 20 ],
				.1);
		statusList = [];
		visitTasks(ROOT, FILTER_ALL, VISIT_ALL_CHILDREN, function(task) {
			var taskStatus = task.getStatus();
			if (statusList.indexOf(taskStatus) == -1) {
				statusList.push(taskStatus);
			}
		});
		statusList.sort();
		bus.send("data-ready");
	});

	bus.listen("plan", function(e, plan) {
		ROOT.tasks = plan;
		bus.send("refresh-tree");
	});

	bus.listen("filter", function(e, newFilter) {
		userFilter = newFilter;
		if (userFilter != null) {
			userChildrenFilter = VISIT_ALL_CHILDREN;
		} else {
			userChildrenFilter = null;
		}
		bus.send("refresh-tree");
	});

	bus.listen("save", function() {
		bus.send("show-wait-mask", "Salvando...");
		bus.send("ajax", {
			type : 'POST',
			url : 'plan',
			contentType : "application/json",
			data : JSON.stringify(ROOT.tasks),
			success : function(data, textStatus, jqXHR) {
				bus.send("info", "Guardado");
			},
			errorMsg : "No se salvó",
			complete : function() {
				bus.send("hide-wait-mask");
			}
		});

	});

	return {
		"decorateTask" : decorateTask,
		"getTask" : getTask,
		"ROOT" : ROOT,
		"VISIT_ALL_CHILDREN" : VISIT_ALL_CHILDREN,
		"FILTER_ALL" : FILTER_ALL,
		"VISIT_UNFOLDED_CHILDREN" : VISIT_UNFOLDED_CHILDREN,
		"NAME_EXTRACTOR" : NAME_EXTRACTOR,
		"visitTasks" : visitTasks,
		"getDates" : getDates,
		"getTimeDomain" : function() {
			return timeDomain;
		},
		"getTaskNames" : function() {
			return taskNames;
		},
		"getXScale" : function() {
			return xScale;
		},
		"getYScale" : function() {
			return yScale;
		},
		"getStatusList" : function() {
			return statusList;
		}
	}
});
