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
			this.baseHeight = this.getHeight();
		}

		if (this.classList.contains('x-scrollable'))
			xui.scrollable.attach(this);
	},

	onConnected: function()
	{
		if (!this.dataset.rows)
			return;

		if (this._observer == null)
		{
			this._observer = new MutationObserver (() =>
			{
				if (this.children.length == 0 || this.children[0].tagName != 'SPAN')
					return;

				const h = this.getHeight(this.children[0]);
				if (h == this.itemHeight) return;

				this.itemHeight = h;
				this.style.height = (this.dataset.rows*this.itemHeight + this.baseHeight) + 'px';
			});
		}

		this._observer.observe (this, { childList: true });
	},

	onDisconnected: function()
	{
		if (!this.dataset.rows)
			return;

		this._observer.disconnect();
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
