define([ "text!plan.json", "g", "utils" ], function(plan, g, utils) {
	var plan = JSON.parse(plan);
	var taskNames = [];

	var processTask = function(task) {
		if (!task.hasOwnProperty("status")) {
			task["status"] = "short";
		}

		taskNames.push(task["taskName"]);

		if (task.hasOwnProperty("tasks")) {
			task["status"] = "gruppe";
			for (var i = 0; i < task.tasks.length; i++) {
				processTask(task.tasks[i]);
			}
		} else {
			if (task.hasOwnProperty("startDate")) {
				task["startDate"] = new Date(task["startDate"]);
				task["endDate"] = new Date(task["endDate"]);
			} else {
				task["startDate"] = utils.today;
				task["endDate"] = new Date(utils.today.getTime() + utils.DAY_MILLIS);
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
	g.create();
	g.updateChart(plan);

});