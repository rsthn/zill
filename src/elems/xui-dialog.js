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

	show: function()
	{
		if (this.classList.contains('visible'))
			return;

		this.classList.remove('hidden');
		this.classList.add('visible');
	},

	hide: function()
	{
		if (this.classList.contains('hidden'))
			return;

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
