const Element = require('@rsthn/rin/element');
const xui = require('../xui');

Element.register ('xui-dialog',
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

		if (this.classList.contains('x-draggable')) {
			xui.draggable.attach(this.querySelector('.header'), this);
		}
	},

	hide: function()
	{
		this.classList.remove('visible');
		this.classList.add('hidden');
	},

	show: function()
	{
		this.classList.remove('hidden');
		this.classList.add('visible');
	}
});
