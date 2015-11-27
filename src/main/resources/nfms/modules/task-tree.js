define([ "message-bus" ], function(bus) {

	var nameIndicesMap = {};

	var userFilter = null;

	var ROOT = {
		"taskName" : "root",
		"tasks" : null
	}

	var FILTER_ALL = function(task) {
		return task != ROOT;
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
		if (filter(task) && (userFilter == null || userFilter(task))) {
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

	var getTask = function(taskName) {
		var taskIndices = nameIndicesMap[taskName];
		var ret = ROOT;
		for (var i = 0; i < taskIndices.length; i++) {
			ret = ret.tasks[taskIndices[i]];
		}
		return ret;
	};

	bus.listen("refresh-tree", function(e) {
		visitTasks(ROOT, FILTER_ALL, VISIT_UNFOLDED_CHILDREN, function(task, index) {
			nameIndicesMap[task.taskName] = index;
		});
		bus.send("data-ready");
	});

	bus.listen("plan", function(e, plan) {
		ROOT.tasks = plan;
		bus.send("refresh-tree");
	});

	bus.listen("filter", function(e, newFilter) {
		userFilter = newFilter;
		bus.send("refresh-tree");
	});

	bus.listen("save", function() {
		bus.send("show-wait-mask", "Salvando...");
		bus.send("ajax", {
			type : 'POST',
			url : 'save-plan',
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
		"getTask" : getTask,
		"ROOT" : ROOT,
		"VISIT_ALL_CHILDREN" : VISIT_ALL_CHILDREN,
		"FILTER_ALL" : FILTER_ALL,
		"VISIT_UNFOLDED_CHILDREN" : VISIT_UNFOLDED_CHILDREN,
		"NAME_EXTRACTOR" : NAME_EXTRACTOR,
		"visitTasks" : visitTasks
	}
});
