const xui = require('../xui');

xui.register ('xui-element',
{
	isRoot: true,

	events: {
		"click [data-action]": function(evt) {
			this[evt.source.dataset.action] (evt);
		},

		"keyup(13) input[data-enter]": function(evt) {
			this[evt.source.dataset.enter] (evt);
		}
	},

	init: function()
	{
	}
});
