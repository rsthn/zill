const xui = require('../xui');

xui.register ('xui-dialog', 'xui-element',
{
	init: function()
	{
		this.classList.add('xui-dialog');

		if (this.classList.contains('x-draggable'))
			xui.draggable.attach(this.querySelector('.header'), this);
	},

	show: function(imm)
	{
		if (this.classList.contains('visible'))
			return;

		this.classList.remove('imm', 'hidden');
		this.classList.add('visible');

		if (imm === true) this.classList.add('imm');
	},

	hide: function(imm)
	{
		if (this.classList.contains('hidden'))
			return;

		this.classList.remove('imm', 'visible');
		this.classList.add('hidden');

		if (imm === true) this.classList.add('imm');
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
