define([ "text!plan.json", "utils", "message-bus", "gantt" ], function(plan, utils, bus) {
	var plan = JSON.parse(plan);
	var taskNames = [];

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

		taskNames.push(task["taskName"]);

		if (task.hasOwnProperty("tasks")) {
			for (var i = 0; i < task.tasks.length; i++) {
				processTask(task.tasks[i]);
			}
		} else {
			if (task.hasOwnProperty("startDate")) {
				task["getStartDate"] = function() {
					return new Date(task["startDate"]);
				}
				task["getEndDate"] = function() {
					return new Date(task["endDate"]);
				}
			} else {
				task["getStartDate"] = function() {
					return utils.today;
				}
				task["getEndDate"] = function() {
					return new Date(utils.today.getTime() + utils.DAY_MILLIS);
				}
			}
		}
	}
	for (var i = 0; i < plan.length; i++) {
		processTask(plan[i]);
	}
	var taskStatus = {
		"short" : "bar-short",
		"nachundnach" : "bar-nachundnach",
		"freitag" : "bar-freitag",
		"abends" : "bar-abends",
		"morgens" : "bar-morgens",
		"nachmittags" : "bar-nachmittags",
		"group" : "bar-group"
	};

	bus.send("plan", [ plan ]);

});