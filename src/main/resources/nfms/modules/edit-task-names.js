define([ "message-bus", "task-tree" ], function(bus, taskTree) {

	var selectedTaskName;

	bus.listen("keypress", function(e, d3Event) {
		if (d3Event.keyCode == 113 && selectedTaskName != null) {
			if (d3Event.shiftKey) {
				bus.send("edit-selected-content");
			} else {
				bus.send("edit-selected-name");
			}
		}
	});

	bus.listen("edit-selected-name", function() {
		edit(function(tickSelection) {
			return tickSelection.append("foreignObject")//
			.attr("width", "600px")//
			.attr("height", "25px")//
			.attr("class", "editable")//
			.append("xhtml:input").attr("value", function() {
				// nasty spot to place this call, but here we are sure that the
				// <input> tag is available
				// and is handily pointed at by 'this':
				this.focus();

				return selectedTaskName;
			}).attr("style", "width: 594px;");
		}, function(text) {
			return taskTree.getTask(selectedTaskName).setTaskName(text);
		});
	});

	bus.listen("edit-selected-content", function() {
		var task = taskTree.getTask(selectedTaskName);
		edit(function(tickSelection) {
			return tickSelection.append("foreignObject")//
			.attr("width", "600px")//
			.attr("height", "15em")//
			.attr("class", "editable")//
			.append("xhtml:textarea").html(function() {
				this.focus();
				return task.getContent();
			})//
			.attr("style", "width: 594px;")//
			.attr("rows", "15");
		}, function(text) {
			task["content"] = text;
			return true;
		});
	});

	var edit = function(builder, enterAction) {
		var tickSelection = d3.select(".gantt-chart").selectAll(".y.axis .tick").filter(
				function(d) {
					return d == selectedTaskName;
				});
		var cancel = false;
		var input = builder(tickSelection)
		// make the form go away when you jump out (form looses focus) or
		// hit ENTER:
		.on("blur", function() {
			// Note to self: frm.remove() will remove the entire <g>
			// group!
			// Remember the D3 selection logic!
			tickSelection.select(".editable").remove();
			bus.send("enable-keylistener");
		}).on("keyup", function() {
			// IE fix
			if (!d3.event)
				d3.event = window.event;

			var e = d3.event;
			if (e.keyCode == 13) {
				if (typeof (e.cancelBubble) !== 'undefined') // IE
					e.cancelBubble = true;
				if (e.stopPropagation)
					e.stopPropagation();
				e.preventDefault();

				var task = taskTree.getTask(selectedTaskName);
				if (enterAction(input.node().value)) {
					input.node().blur();
					bus.send("refresh-tree");
					bus.send("select-task", [ task.taskName ]);
				}
			} else if (e.keyCode == 27) {
				input.node().blur();
			}
		});
		bus.send("disable-keylistener");
	}

	bus.listen("selection-update", function(e, newSelectedName) {
		selectedTaskName = newSelectedName;
	});

});
