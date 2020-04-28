const { Element } = require('@rsthn/rin-front');
const { Template } = require('@rsthn/rin');

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

	overlapTest: function (rect1, rect2)
	{
		var _x1 = Math.max(rect1.left, rect2.left);
		var _y1 = Math.max(rect1.top, rect2.top);
		var _x2 = Math.min(rect1.right, rect2.right);
		var _y2 = Math.min(rect1.bottom, rect2.bottom);
	
		return Math.max(0, _y2-_y1) * Math.max(0, _x2-_x1) > 0;	
	},

	position:
	{
		get: function (elem)
		{
			let p = elem.getBoundingClientRect();
			return { x: p.left, y: p.top, width: p.width, height: p.height };
		},

		set: function (elem, ...args)
		{
			if (args.length == 1)
				return this.set (elem, args[0].x, args[0].y);

			elem.style.position = 'absolute';
			elem.style.margin = 0;
			elem.style.transform = 'translateX(0) translateY(0)';

			elem.style.left = args[0] + 'px';
			elem.style.top = args[1] + 'px';
		}
	},

	draggable:
	{
		initialized: false,

		state: { enabled: false, sx: 0, sy: 0, pos: null, target: null },
		group: { },

		attach: function (handle, target, group)
		{
			if (!handle || !target)
				return;

			if (!group) group = 'default';

			if (!this.initialized)
			{
				window.addEventListener('mousemove', this._mousemove.bind(this), true);
				window.addEventListener('mouseup', this._mouseup.bind(this), true);
				this.initialized = true;
			}

			if (!(group in this.group))
				this.group[group] = { max: 800, list: [ ] };

			target.style.zIndex = this.group[group].max++;
			this.group[group].list.push(target);

			target.front = () =>
			{
				target.style.zIndex = this.group[group].max;

				for (let i of this.group[group].list)
					i.style.zIndex--;

				if ('onFront' in target)
					target.onFront();
			};

			handle.onmousedown = (evt) =>
			{
				this.state.sx = evt.clientX;
				this.state.sy = evt.clientY;
				this.state.target = target;
				this.state.pos = xui.position.get(target);
				this.state.enabled = true;

				target.front();
			};
		},

		_mousemove: function (evt)
		{
			if (!this.state.enabled)
				return;

			evt.preventDefault();
			evt.stopPropagation();

			let dx = evt.clientX - this.state.sx;
			let dy = evt.clientY - this.state.sy;

			xui.position.set (this.state.target, this.state.pos.x + dx, this.state.pos.y + dy);

			if ('onDraggableMoved' in this.state.target)
				this.state.target.onDraggableMoved(this.state.pos.x + dx, this.state.pos.y + dy);
		},

		_mouseup: function (evt)
		{
			if (this.state.enabled)
			{
				this.state.enabled = false;
				evt.preventDefault();
				evt.stopPropagation();
			}
		}
	},

	scrollable:
	{
		attach: function (target)
		{
			let mutex = false;

			let bar = document.createElement('em');
			bar.classList.add('vs-bar');
			bar.classList.add('pseudo');

			let innerBar = document.createElement('em');
			bar.appendChild(innerBar);

			let innerMostBar = document.createElement('em');
			innerBar.appendChild(innerMostBar);

			target.appendChild(bar);

			let update = function()
			{
				let height = target.getBoundingClientRect().height;
				innerMostBar.style.height = (100*height / target.scrollHeight).toFixed(2) + "%";

				bar.style.top = target.scrollTop + "px";
				innerMostBar.style.top = (100*target.scrollTop / target.scrollHeight).toFixed(2) + "%";
			};

			target._observer_scroll = new MutationObserver(function()
			{
				if (mutex) return;
				mutex = true;

				if (bar.parentNode != target)
				{
					bar.style.top = '0px';
					innerMostBar.style.height = '0px';

					target.appendChild(bar);
				}

				update();
				mutex = false;
			});

			target._observer_scroll.observe (target, { childList: true });
			update();

			target.onwheel = function (evt)
			{
				target.scrollTop += 15*evt.deltaY;

				bar.style.top = target.scrollTop + "px";
				innerMostBar.style.top = (100*target.scrollTop / target.scrollHeight).toFixed(2) + "%";
			};
		}
	},

	editable:
	{
		/*
		**	Attaches an editable to the specified target. The callback(new_value, old_value) is called when an event on the input happens (blur, ENTER-key, ESC-key),
		**	and if the callback returns false editing will continue (and the input will be re-focused), if the callback returns true nothing will be done, and if
		**	any other value is returned, it will be used as the new text content of the target. A new_value of null is sent to the callback when ESC or onblur happens.
		*/
		attach: function (target, prev_value, callback)
		{
			if (target.querySelector('.inline-input') != null)
				return;

			if (prev_value == null)
				prev_value = target.innerText.trim();

			let input = document.createElement('input');
			input.className = 'inline-input';
			input.type = 'text';
			input.value = prev_value;

			let fn = function (cur_value)
			{
				let new_value = callback(cur_value, prev_value);
				if (new_value === true) return;

				if (new_value !== false)
				{
					target.classList.remove('p-relative');
					target.innerText = new_value;
				}
				else
				{
					setTimeout(() => {
						input.select();
						input.focus();
					}, 100);
				}
			};

			input.onblur = () => fn(null)

			input.onkeydown = (evt) =>
			{
				if (evt.keyCode == 27 || evt.keyCode == 13)
				{
					evt.preventDefault();
					evt.stopPropagation();
				}

				if (evt.keyCode == 27)
					return input.onblur();

				if (evt.keyCode == 13)
					fn(input.value.trim());
			};

			target.classList.add('p-relative');
			target.appendChild(input);

			input.select();
			input.focus();
		}
	},

	selectable:
	{
		initialized: false,

		state: 0,
		sx: 0, sy: 0, limit: null,
		rect: { left: 0, top: 0, right: 0, bottom: 0 },

		div: null,

		attach: function (target)
		{
			if (!this.initialized)
			{
				this.div = document.createElement('div');
				this.div.style.position = 'absolute';
				this.div.style.zIndex = '99999';
				this.div.style.left = '0px';
				this.div.style.top = '0px';
				this.div.style.background = 'rgba(255,255,255,0.25)';
				this.div.style.border = '1px solid rgba(0,0,0,0.5)';
				document.body.appendChild (this.div);

				window.addEventListener('mousemove', (evt) =>
				{
					if (!this.state) return;
	
					evt.preventDefault();
					evt.stopPropagation();
	
					this.rect.left = Math.max(Math.min(this.sx, evt.clientX), this.limit.left);
					this.rect.top = Math.max(Math.min(this.sy, evt.clientY), this.limit.top);
					this.rect.right = Math.min(Math.max(this.sx, evt.clientX), this.limit.right);
					this.rect.bottom = Math.min(Math.max(this.sy, evt.clientY), this.limit.bottom);

					this.div.style.left = this.rect.left + 'px';
					this.div.style.top = this.rect.top + 'px';
					this.div.style.width = (this.rect.right - this.rect.left) + 'px';
					this.div.style.height = (this.rect.bottom - this.rect.top) + 'px';
				},
				true);

				window.addEventListener('mouseup', (evt) =>
				{
					if (!this.state) return;

					this.div.style.left = '-1000px';
					this.div.style.top = '-1000px';

					this.state = 0;

					let list = [];

					for (let i of this.target.selection)
						i.classList.remove('selected');

					for (let i of this.target.children)
					{
						if (xui.overlapTest(this.rect, i.getBoundingClientRect()))
						{
							i.classList.add('selected');
							list.push(i);
						}
					}

					this.target.selection = list;

					if ('onSelectionChanged' in this.target)
						this.target.onSelectionChanged (this.target.selection);
				});

				this.initialized = true;
			}

			target.unselectable ='on';
			target.style.userSelect = 'none';
			target.selection = [];

			target.addEventListener('mousedown', (evt) =>
			{
				if (evt.which != 1)	return

				this.limit = target.getBoundingClientRect();
				this.target = target;
				this.state = 1;

				this.sx = evt.clientX;
				this.sy = evt.clientY;

				this.rect.left = this.sx-1;
				this.rect.top = this.sy-1;
				this.rect.right = this.sx+1;
				this.rect.bottom = this.sy+1;
			});
		}
	},

	/**
	**	Forces the browser to show a download dialog.
	*/
	showDownload: function (filename, dataUrl)
	{
		var link = document.createElement("a");
		link.href = dataUrl;

		link.style.display = 'none';
		link.download = filename;
		link.target = "_blank";

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	},

	/**
	**	Forces the browser to show a file selection dialog.
	*/
	showFilePicker: function (allowMultiple, callback)
	{
		var input = document.createElement("input");

		input.type = "file";
		input.style.display = 'none';
		input.multiple = allowMultiple;

		document.body.appendChild(input);

		input.onchange = function ()
		{
			callback(input.files);
		};

		document.body.onfocus = function ()
		{
			document.body.onfocus = null;
			document.body.removeChild(input);
		};

		input.click();
	},

	/**
	**	Loads a URL using FileReader and returns as a dataURL.
	*/
	loadAsDataURL: function (file, callback)
	{
		var reader = new FileReader();

		reader.onload = function(e) {
			callback (e.target.result);
		};

		reader.readAsDataURL(file);
	},

	/**
	**	Loads a URL using FileReader and returns as text.
	*/
	loadAsText: function (file, callback)
	{
		var reader = new FileReader();

		reader.onload = function(e) {
			callback (e.target.result);
		};

		reader.readAsText(file);
	},

	/**
	**	Loads a URL using FileReader and returns as an array buffer.
	*/
	loadAsArrayBuffer: function (file, callback)
	{
		var reader = new FileReader();

		reader.onload = function(e) {
			callback (e.target.result);
		};

		reader.readAsArrayBuffer(file);
	},

	/**
	**	Loads an array of URLs using FileReader and returns them as data url.
	*/
	loadAllAsDataURL: function (fileList, callback)
	{
		var result = [];

		if (!fileList || !fileList.length)
		{
			callback(result);
			return;
		}

		var loadNext = function (i)
		{
			if (i == fileList.length)
			{
				callback(result);
				return;
			}

			xui.loadAsDataURL (fileList[i], function(url) {
				result.push({ name: fileList[i].name, size: fileList[i].size, url: url });
				loadNext(i+1);
			});
		};

		loadNext(0);
	}
};
