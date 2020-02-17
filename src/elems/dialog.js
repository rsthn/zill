const xui = require('../xui');

xui.register ('xui-dialog',
{
	isRoot: true,

	events: {
		"click [data-action]": function(evt) {
			this[evt.source.dataset.action] ();
		}
	},

	init: function()
	{
		this.classList.add('xui-dialog');

		if (this.classList.contains('x-draggable'))
			xui.draggable.attach(this.querySelector('.header'), this);
	},

	hide: function()
	{
		this.classList.remove('visible');
		this.classList.add('hidden');
	},

	maximize: function()
	{
		this.classList.add('maximized');
	},

	restore: function()
	{
		this.classList.remove('maximized');
	}
});
