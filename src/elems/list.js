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
		this.type = 'field';

		if (this.dataset.rows)
		{
			this.style.height = '0px';
			this.style.height = (this.dataset.rows*this.getHeight(this.children[0]) + this.getHeight()) + 'px';
		}
	},

	setValue: function (value)
	{
		let selected = this.querySelector('span[data-value="'+value+'"]');
		if (!selected) return;

		let curr = this.querySelector('span.selected');
		if (curr)
		{
			if (curr.dataset.value == value)
				return;

			curr.classList.remove('selected');
		}

		selected.classList.add('selected');

		if (this.onchange) this.onchange();
	},

	getValue: function()
	{
		let selected = this.querySelector('span.selected');
		return selected ? selected.dataset.value : null;
	}
});
