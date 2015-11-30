define([ "text!../plan", "utils", "message-bus", "gantt" ], function(plan, utils, bus) {
	var plan = JSON.parse(plan);

	var processTask = function(task) {
		task["getStatus"] = function() {
			if (task.hasOwnProperty("tasks")) {
				return "gruppe";
			} else if (task.hasOwnProperty("status")) {
				return task.status;
			} else {
				return "short";
			}
		}

		task["getStartDate"] = function() {
			if (!task.hasOwnProperty("tasks")) {
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
			if (!task.hasOwnProperty("tasks")) {
				if (task.hasOwnProperty("endDate")) {
					return new Date(task["endDate"]);
				} else {
					return new Date(utils.today.getTime() + utils.DAY_MILLIS);
				}
			} else {
				return null;
			}
		};

		if (task.hasOwnProperty("tasks")) {
			for (var i = 0; i < task.tasks.length; i++) {
				processTask(task.tasks[i]);
			}
		}
	}
	for (var i = 0; i < plan.length; i++) {
		processTask(plan[i]);
	}

	bus.listen("modules-loaded", function() {
		bus.send("plan", [ plan ]);
	});

});