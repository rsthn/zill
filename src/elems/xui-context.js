const xui = require('../xui');

xui.register ('xui-context',
{
	isRoot: true,

	init: function()
	{
		this.classList.add('xui-dropdown');
		this.classList.add('xui-context');
	},

	onConnected: function()
	{
		this.root = this.findRoot();

		this._contextListener = this.root.listen ('contextmenu', this.dataset.target, (evt) =>
		{
			this.classList.add('visible');

			let hdl = () => {
				this.classList.remove('visible');
				window.removeEventListener('click', hdl);
			};

			window.addEventListener('click', hdl);

			let parent = xui.position.get(this.root);
			xui.position.set(this, evt.clientX - parent.x, evt.clientY - parent.y);
		});
	},

	onDisconnected: function()
	{
		this._contextListener.remove();
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
	}
});
