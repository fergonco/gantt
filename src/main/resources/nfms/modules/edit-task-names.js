define([ "message-bus", "task-tree" ], function(bus, taskTree) {

	var selectedTaskName;

	bus.listen("keypress", function(e, d3Event) {
		if (d3Event.keyCode == 113 && selectedTaskName != null) {
			bus.send("edit-selected");
		}
	});

	bus.listen("edit-selected", function() {
		var tickSelection = d3.select(".gantt-chart").selectAll(".y.axis .tick").filter(
				function(d) {
					return d == selectedTaskName;
				});
		var cancel = false;
		var input = tickSelection.append("foreignObject")//
		.attr("width", "600px")//
		.attr("height", "25px")//
		.attr("class", "editable")//
		.append("xhtml:form").append("input").attr("value", function() {
			// nasty spot to place this call, but here we are sure that the
			// <input> tag is available
			// and is handily pointed at by 'this':
			this.focus();

			return selectedTaskName;
		}).attr("style", "width: 594px;")
		// make the form go away when you jump out (form looses focus) or
		// hit ENTER:
		.on("blur", function() {
			var task = taskTree.getTask(selectedTaskName);
			if (!cancel) {
				task.taskName = input.node().value;
			}
			// Note to self: frm.remove() will remove the entire <g>
			// group!
			// Remember the D3 selection logic!
			tickSelection.select(".editable").remove();
			if (!cancel) {
				bus.send("refresh-tree");
				bus.send("select-task", [ task.taskName ]);
			}
		}).on("keypress", function() {
			// IE fix
			if (!d3.event)
				d3.event = window.event;

			var e = d3.event;
			if (e.keyCode == 13) {
				input.node().blur();
				if (typeof (e.cancelBubble) !== 'undefined') // IE
					e.cancelBubble = true;
				if (e.stopPropagation)
					e.stopPropagation();
				e.preventDefault();
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
			} else if (e.keyCode == 27) {
				cancel = true;
				input.node().blur();
			}
		});
	});

	bus.listen("selection-update", function(e, newSelectedName) {
		selectedTaskName = newSelectedName;
	});

});
