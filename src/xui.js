const Element = require('@rsthn/rin/element');
const Template = require('@rsthn/rin/template');

const xui = module.exports =
{
	elements: [ ],

	template: function (str)
	{
		return Template.compile(str);
	},

	register: function (name, ...protos)
	{
		this.elements.push(name);
		Element.register(name, ...protos);
	},

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
	},

	scrollable:
	{
		initialized: false,

		attach: function (target)
		{
			let mutex = false;

			let bar = document.createElement('em');
			bar.classList.add('vs-bar');

			let innerBar = document.createElement('em');
			bar.appendChild(innerBar);

			let innerMostBar = document.createElement('em');
			innerBar.appendChild(innerMostBar);

			target.appendChild(bar);

			target._observer_scroll = new MutationObserver(function()
			{
				if (mutex) return;

				mutex = true;
				let height = target.getBoundingClientRect().height;

				if (bar.parentNode != target)
				{
					bar.style.top = '0px';
					innerMostBar.style.height = '0px';

					target.appendChild(bar);
				}

				mutex= false;
			});

			target._observer_scroll.observe(target, { childList: true });

			let update = function()
			{
				let height = target.getBoundingClientRect().height;
				innerMostBar.style.height = (100*height / target.scrollHeight).toFixed(2) + "%";
				bar.style.top = target.scrollTop + "px";
				innerMostBar.style.top = (100*target.scrollTop / target.scrollHeight).toFixed(2) + "%";
			};

			update();

			target.onwheel = function (evt)
			{
				target.scrollTop += 15*evt.deltaY;

				bar.style.top = target.scrollTop + "px";
				innerMostBar.style.top = (100*target.scrollTop / target.scrollHeight).toFixed(2) + "%";
			};
		}
	}
};
