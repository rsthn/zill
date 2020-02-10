const xui = require('../xui');

xui.register ('xui-list',
{
	events: {
		"click span[data-value]": function(evt) {
			this.setValue (evt.source.dataset.value);
		}
	},

	init: function()
	{
		this.classList.add('xui-list');

		if (this.dataset.rows)
		{
			this.style.height = '0px';
			this.style.height = (this.dataset.rows*this.getHeight(this.children[0]) + this.getHeight()) + 'px';
		}
	},

	setValue: function (value)
	{
		let selected = this.querySelector('span[data-value="'+value+'"]');
		if (!selected) return false;

		this.querySelectorAll('span.selected').forEach(i => i.classList.remove('selected'));
		selected.classList.add('selected');

		return true;
	},

	getValue: function (value)
	{
		let selected = this.querySelector('span.selected');
		return selected ? selected.dataset.value : null;
	}
});
