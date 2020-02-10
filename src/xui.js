const xui = module.exports =
{
	alignValue: function (value, step)
	{
		return Math.round(value/step)*step;
	},

	position:
	{
		get: function (elem)
		{
			let p = elem.getBoundingClientRect();
			return { x: p.left, y: p.top };
		},

		set: function (elem, ...args)
		{
			if (args.length == 1)
				return this.set (elem, args[0].x, args[0].y);

			elem.style.position = 'absolute';
			elem.style.margin = 0;

			elem.style.left = args[0] + 'px';
			elem.style.top = args[1] + 'px';
		}
	},

	draggable:
	{
		initialized: false,
		state: { enabled: false, sx: 0, sy: 0, pos: null, target: null },

		attach: function (handle, target, options)
		{
			if (!handle || !target)
				return;

			if (!this.initialized)
			{
				window.onmousemove = this._handler.bind(this);
				this.initialized = true;
			}

			handle.onmousedown = (evt) => {
				this.state.sx = evt.clientX;
				this.state.sy = evt.clientY;
				this.state.pos = xui.position.get(this.state.target = target);
				this.state.enabled = true;
			};

			handle.onmouseup = (evt) => {
				this.state.enabled = false;
			};
		},

		_handler: function (evt)
		{
			if (!this.state.enabled)
				return;

			let dx = evt.clientX - this.state.sx;
			let dy = evt.clientY - this.state.sy;

			xui.position.set (this.state.target, this.state.pos.x + dx, this.state.pos.y + dy);
		}
	}
};
