(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
/*
**	rin/api
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const base64 = require('base-64');

if (!('fetch' in global))
	var fetch = require('node-fetch');

/**
**	API interface utility functions.
*/

module.exports =
{
	/**
	**	Target URL for all the API requests.
	*/
	apiUrl: "/api",

	/**
	**	Indicates if all request data will be packed into a _req64 parameter instead of individual fields.
	*/
	useReq64: false,

	/**
	**	Number of retries to execute each API call before giving up and invoking error handlers.
	*/
	retries: 1,

	/**
	**	Level of the current request. Used to detect nested requests.
	*/
	_requestLevel: 0,

	/**
	**	Indicates if all API calls should be bundled in a request package. Activated by calling the packageBegin() function and finished with packageEnd().
	*/
	_requestPackage: 0,

	/**
	**	When in package-mode, this contains the package data to be sent upon a call to packageEnd().
	*/
	_packageData: [],

	/**
	**	Overridable filter that processes the response from the server and returns true if it was successful.
	*/
	responseFilter: function (res, req)
	{
		if (res.response == 408 && global.location)
		{
			global.location.reload();
			return false;
		}

		return true;
	},

	/**
	**	Sets the API functions to package-mode and bundles requests together.
	*/
	packageBegin: function ()
	{
		this._requestPackage++;
	},

	/**
	**	Sends a single API request with the currently constructed package and finishes package-mode.
	*/
	packageEnd: function ()
	{
		if (!this._requestPackage)
			return;

		if (--this._requestPackage)
			return;

		this.packageSend();
	},

	/**
	**	Sends a single API request with the currently constructed package and maintains package-mode.
	*/
	packageSend: function ()
	{
		if (!this._packageData.length)
			return;

		let _packageData = this._packageData;
		this._packageData = [];

		var rpkg = "";

		for (var i = 0; i < _packageData.length; i++)
		{
			rpkg += "r"+i+","+base64.encode(this.encodeParams(_packageData[i][2]))+";";
		}

		this._showProgress();

		this.post(
			{ rpkg: rpkg },

			(res, req) =>
			{
				for (let i = 0; i < _packageData.length; i++)
				{
					try
					{
						var response = res["r"+i];
						if (!response)
						{
							if (_packageData[i][1] != null) _packageData[i][1] (_packageData[i][2]);
							continue;
						}

						if (_packageData[i][0] != null)
						{
							if (this.responseFilter (response, _packageData[i][2]))
							{
								_packageData[i][0] (response, _packageData[i][2]);
							}
						}
					}
					catch (e) {
					}
				}
			},

			(req) =>
			{
				for (let i = 0; i < _packageData.length; i++)
				{
					if (_packageData[i][1] != null) _packageData[i][1] (_packageData[i][2]);
				}
			}
		);
	},

	/**
	**	Adds CSS class 'busy' to the HTML root element, works only if running inside a browser.
	*/
	_showProgress: function ()
	{
		if ('document' in global) {
			this._requestLevel++;
			if (this._requestLevel > 0) global.document.documentElement.classList.add('busy');
		}
	},

	/**
	**	Removes the 'busy' CSS class from the HTML element.
	*/
	_hideProgress: function ()
	{
		if ('document' in global) {
			this._requestLevel--;
			if (!this._requestLevel) global.document.documentElement.classList.remove('busy');
		}
	},

	/**
	**	Returns a parameter string for a GET request given an object with fields.
	*/
	encodeParams: function (obj)
	{
		let s = [];

		for (let i in obj)
			s.push(encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]));

		return s.join('&');
	},

	/**
	**	Executes an API call to the URL stored in apiUrl.
	*/
	apiCall: function (params, success, failure, type, retries)
	{
		let url = this.apiUrl;

		if (type != 'GET' && type != 'POST')
			type = 'auto';

		if (this._requestPackage)
		{
			this._packageData.push([success, failure, params]);
			return;
		}

		this._showProgress();

		let request = params;
		params = this.encodeParams(params);

		if (type == 'auto' && !this.useReq64 /*&& !(params instanceof FormData)*/)
		{
			type = params.length < 960 ? 'GET' : type;
		}

		if (retries === undefined)
			retries = this.retries;

		if (type == 'auto') type = 'POST';

		if (this.useReq64 /* && !(params instanceof FormData) */)
			params = "_req64=" + base64.encode(params);

		(type == 'GET' ? fetch(url + '?_=' + Date.now() + '&' + params) : fetch(url, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, method: 'POST', body: params }))
		.then(result => result.json())
		.then(result =>
		{
			this._hideProgress();
			if (!success) return

			if (this.responseFilter(result, request))
				success(result, request);
		})
		.catch(err =>
		{
			this._hideProgress();

			if (retries == 0) {
				if (failure) failure(request);
			} else {
				this.apiCall (request, success, failure, type, retries-1);
			}
		});
	},

	/**
	**	Executes a POST API call.
	*/
	post: function (params, success, failure)
	{
		return this.apiCall(params, success, failure, 'POST');
	},

	/**
	**	Executes a GET API call.
	*/
	get: function (params, success, failure)
	{
		return this.apiCall(params, success, failure, 'GET');
	},

	/**
	**	Executes an automatic API call, returns a promise.
	*/
	fetch: function (params)
	{
		return new Promise((resolve, reject) => {
			this.apiCall(params, resolve, reject);
		});
	}
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base-64":20,"node-fetch":21}],2:[function(require,module,exports){
(function (global){
/*
**	rin/element
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const { Rin, Model, Template } = require('@rsthn/rin');

/*
**	Base class for custom elements.
*/

const Element = module.exports = 
{
	/**
	**	Map containing the original prototypes for all registered elements.
	*/
	protos: { },

	/**
	**	Indicates if the element is a root element, that is, the target element to attach child elements having data-ref attribute.
	*/
	isRoot: true,

	/**
	**	All children elements having data-ref are added to this map (and to the element itself).
	*/
	refs: null,

	/**
	**	Model type (class) for the element's model.
	*/
	modelt: Model,

	/**
	**	Data model related to the element.
	*/
	model: null,

	/**
	**	Events map.
	*/
	events: null,

	/**
	**	Element constructor.
	*/
	__ctor: function()
	{
		this._list_watch = [];
		this._list_visible = [];
		this._list_property = [];

		this.refs = { };

		if (this.model != null)
		{
			let tmp = this.model;
			this.model = null;
			this.setModel (tmp);
		}

		this.isReady = false;
		this.init();

		Object.keys(this._super).reverse().forEach(i =>
		{
			if ('init' in this._super[i])
				this._super[i].init();
		});

		if (this.events)
			this.bindEvents (this.events);

		const ready = () =>
		{
			this.ready();
			this.isReady = true;

			Object.keys(this._super).reverse().forEach(i =>
			{
				if ('ready' in this._super[i])
					this._super[i].ready();
			});

			this.collectWatchers();

			if (this.root && this.root._mutationHandler)
				this.root._mutationHandler();
		};

		let timeout = null;

		this._mutationHandler = () =>
		{
			if (this.children.length == 0)
				return;

			for (let i in this.refs)
			{
				if (!this.refs[i].isReady) return;
			}

			if (timeout) clearTimeout(timeout);

			timeout = setTimeout(() =>
			{
				timeout = null;

				for (let i in this.refs)
				{
					if (!this.refs[i].isReady) return;
				}

				this._mutationHandler = null;

				this._mutationObserver.disconnect();
				this._mutationObserver = null;

				ready();
			},
			50);
		};

		this._mutationObserver = new MutationObserver (this._mutationHandler);
		this._mutationObserver.observe(this, { attributes: false, childList: true, subtree: false });

		this._mutationHandler();
	},

	/**
	**	Initializes the element. Called after construction of the instance.
	**
	**	>> void init();
	*/
	init: function()
	{
	},

	/**
	**	Executed when the children of the element are ready.
	**
	**	>> void ready();
	*/
	ready: function()
	{
	},

	/**
	**	Sets the model of the element and executes the modelChanged event handler.
	**
	**	>> Element setModel (Model model, [bool update=true]);
	*/
	setModel: function (model, update)
	{
		if (!model) return this;

		model = Rin.ensureTypeOf(this.modelt, model);

		if (this.model != null)
		{
			this.model.removeEventListener ("modelChanged", this.onModelPreChanged, this);
			this.model.removeEventListener ("propertyChanging", this.onModelPropertyChanging, this);
			this.model.removeEventListener ("propertyChanged", this.onModelPropertyPreChanged, this);
			this.model.removeEventListener ("propertyRemoved", this.onModelPropertyRemoved, this);
		}

		this.model = model;

		this.model.addEventListener ("modelChanged", this.onModelPreChanged, this);
		this.model.addEventListener ("propertyChanging", this.onModelPropertyChanging, this);
		this.model.addEventListener ("propertyChanged", this.onModelPropertyPreChanged, this);
		this.model.addEventListener ("propertyRemoved", this.onModelPropertyRemoved, this);

		if (update !== false)
			this.model.update();

		return this;
	},

	/**
	**	Returns the model of the element. This is a dummy function returning the public attribute "model" of this class.
	**
	**	>> Model getModel();
	*/
	getModel: function ()
	{
		return this.model;
	},

	/*
	**	Returns the width of the element.
	**
	**	>> float getWidth([elem]);
	*/
	getWidth: function (elem)
	{
		return (elem || this).getBoundingClientRect().width;
	},

	/*
	**	Returns the height of the element.
	**
	**	>> float getHeight([elem]);
	*/
	getHeight: function (elem)
	{
		return (elem || this).getBoundingClientRect().height;
	},

	/**
	**	Binds all events in the specified map to the element, the events map can have one of the following forms:
	**
	**		"click .button": "doSomething",		(Delegated Event)
	**		"click .button": function() { },	(Delegated Event)
	**		"myevt @this": "...",				(Element Event)
	**		"myevt": "...",						(Element Event)
	**		"myevt @objName": "...",			(Element Event)
	**		"#propname": "...",					(Property Changed Event)
	**		"keyup(10) .input": "..."			(Delegated Event with Parameters)
	**
	**	>> Element bindEvents (object events);
	*/
	bindEvents: function (events)
	{
		for (var evtstr in events)
		{
			let hdl = events[evtstr];

			if (Rin.typeOf(hdl) == 'string')
				hdl = this[hdl];

			hdl = hdl.bind(this);

			var i = evtstr.indexOf(" ");

			var name = i == -1 ? evtstr : evtstr.substr(0, i);
			var selector = i == -1 ? "" : evtstr.substr(i + 1);

			let args = null;

			var j = name.indexOf("(");
			if (j != -1)
			{
				args = name.substr(j+1, name.length-j-2).split(",");
				name = name.substr(0, j);
			}

			if (selector.substr(0,1) == "@")
			{
				if (selector.substr(1) == "this")
				{
					this.listen(name, hdl);
				}
				else
					this[selector.substr(1)].addEventListener(name, hdl);

				continue;
			}

			if (name.substr(0, 1) == "#")
			{
				this.listen("propertyChanged."+name.substr(1), hdl);
				continue;
			}

			if (args != null)
			{
				switch (name)
				{
					case "keyup": case "keydown":
						this.listen (name, selector, function (evt)
						{
							if (Rin.indexOf(args, evt.keyCode.toString()) != -1)
								return hdl (evt, args);

							evt.continuePropagation = true;
						});

						continue;
				}
			}

			this.listen (name, selector, hdl);
		}

		return this;
	},

	/**
	**	Listens for an event for elements matching the specified selector, returns an object with a single method remove() used
	**	to remove the listener when it is no longer needed.
	**
	**	>> object listen (string eventName, string selector, function handler);
	**	>> object listen (string eventName, function handler);
	*/
	listen: function (eventName, selector, handler)
	{
		if (Rin.typeOf(selector) == "function")
		{
			handler = selector;
			selector = null;
		}

		let callback = null;
		let self = this;

		this.addEventListener (eventName, callback = (evt) =>
		{
			let root = this.findRoot (evt.target);
			if (root !== this) return;

			if (evt.continuePropagation === false)
				return;

			evt.continuePropagation = true;

			if (selector && selector != "*")
			{
				let elems = this.querySelectorAll(selector);

				evt.source = evt.target;

				while (evt.source !== this)
				{
					let i = Rin.indexOf (elems, evt.source);
					if (i !== -1)
					{
						evt.continuePropagation = false;

						handler.call (this, evt, evt.detail);
						break;
					}
					else
					{
						evt.source = evt.source.parentElement;
					}
				}
			}
			else
			{
				evt.continuePropagation = false;

				handler.call (this, evt, evt.detail);
			}

			if (!evt.continuePropagation)
			{
				evt.preventDefault();
				evt.stopPropagation();
			}
		},
		true);

		return { removed: false, remove: function() { if (this.removed) return; this.removed = true; self.removeEventListener(eventName, callback, true); } };
	},

	/**
	**	Dispatches a new event with the specified name and the given arguments.
	**
	**	>> void dispatch (string eventName, object args);
	*/
	dispatch: function (eventName, args)
	{
		this.dispatchEvent (new CustomEvent (eventName, { bubbles: true, detail: args }));
	},

	/**
	**	Sets the innerHTML property of the element and runs some post set-content tasks.
	**
	**	>> void setInnerHTML (value);
	*/
	setInnerHTML: function (value)
	{
		if (this._mutationObserver != null)
		{
			this.innerHTML = value;
			return;
		}

		this.innerHTML = value;
		this.collectWatchers();
	},

	/**
	**	Collects all watchers elements (data-watch, data-visible, data-property), that depend on the model, should be invoked
	**	when the structure of the element changed (added/removed children). This is automatically called when the setInnerHTML
	**	method is called.
	**
	**	>> void collectWatchers ();
	*/
	collectWatchers: function ()
	{
		let self = this;
		let modified = false;
		let list;

		let _list_watch_length = this._list_watch.length;
		let _list_visible_length = this._list_visible.length;
		let _list_property_length = this._list_property.length;

		list = this.querySelectorAll("[data-watch]");
		for (let i = 0; i < list.length; i++)
		{
			for (let j of list[i].querySelectorAll('.pseudo'))
				j.remove();

			list[i]._template = Template.compile(list[i].innerHTML);
			list[i]._watch = new RegExp(list[i].dataset.watch);
			list[i].innerHTML = '';

			list[i].removeAttribute('data-watch');
			this._list_watch.push(list[i]);
		}

		list = this.querySelectorAll("[data-visible]");
		for (let i = 0; i < list.length; i++)
		{
			list[i]._visible = Template.compile(list[i].dataset.visible);

			list[i].removeAttribute('data-visible');
			this._list_visible.push(list[i]);
		}

		list = this.querySelectorAll("[data-property]");
		for (let i = 0; i < list.length; i++)
		{
			list[i].onchange = list[i].onblur = function()
			{
				switch (this.type)
				{
					case 'checkbox':
						self.getModel().set(this.name, this.checked ? '1' : '0');
						break;

					case 'field':
						self.getModel().set(this.name, this.getValue());
						break;

					default:
						self.getModel().set(this.name, this.value);
						break;
				}
			};

			if (list[i].tagName == 'SELECT')
			{
				list[i].onmouseup = function()
				{
					self.getModel().set(this.name, this.value);
				};
			}

			list[i].name = list[i].dataset.property;

			list[i].removeAttribute('data-property');
			this._list_property.push(list[i]);
		}

		this._list_watch = this._list_watch.filter(i => i.parentElement != null);
		if (_list_watch_length != this._list_watch.length) modified = true;

		this._list_visible = this._list_visible.filter(i => i.parentElement != null);
		if (_list_visible_length != this._list_visible.length) modified = true;

		this._list_property = this._list_property.filter(i => i.parentElement != null);
		if (_list_property_length != this._list_property.length) modified = true;

		if (this.model != null && modified)
			this.model.update();
	},

	/**
	**	Executed when the element is created and yet not attached to the DOM tree.
	**
	**	>> void onCreated ();
	*/
	onCreated: function()
	{
	},

	/**
	**	Executed when the element is attached to the DOM tree.
	**
	**	>> void onConnected ();
	*/
	onConnected: function()
	{
	},

	/**
	**	Executed when the element is no longer a part of the DOM tree.
	**
	**	>> void onDisconnected ();
	*/
	onDisconnected: function()
	{
	},

	/**
	**	Executed on the root element when a child element has data-ref attribute and it was added to the root.
	**
	**	>> void onRefAdded (string name);
	*/
	onRefAdded: function (name)
	{
	},

	/**
	**	Executed on the root element when a child element has data-ref attribute and it was removed from the root.
	**
	**	>> void onRefRemoved (string name);
	*/
	onRefRemoved: function (name)
	{
	},

	/**
	**	Event handler invoked when the model has changed, executed before onModelChanged() to update internal dependencies,
	**	should not be overriden or elements watching the model will not be updated.
	**
	**	>> void onModelPreChanged (evt, args);
	*/
	onModelPreChanged: function (evt, args)
	{
		let data = this.getModel().get();

		for (let i = 0; i < this._list_watch.length; i++)
		{
			for (let j of args.fields)
			{
				if (!this._list_watch[i]._watch.test(j))
					continue;

				this._list_watch[i].innerHTML = this._list_watch[i]._template(data);
				break;
			}
		}

		for (let i = 0; i < this._list_visible.length; i++)
		{
			if (this._list_visible[i]._visible(data, 'arg'))
				this._list_visible[i].style.display = 'block';
			else
				this._list_visible[i].style.display = 'none';
		}

		this.onModelChanged(evt, args);
	},

	/**
	**	Event handler invoked when the model has changed.
	**
	**	>> void onModelChanged (evt, args);
	*/
	onModelChanged: function (evt, args)
	{
	},

	/**
	**	Event handler invoked when a property of the model is changing.
	**
	**	>> void onModelPropertyChanging (evt, args);
	*/
	onModelPropertyChanging: function (evt, args)
	{
	},

	/**
	**	Event handler invoked when a property of the model has changed, executed before onModelPropertyChanged() to update internal
	**	dependencies, should not be overriden or elements depending on the property will not be updated.
	**
	**	>> void onModelPropertyPreChanged (evt, args);
	*/
	onModelPropertyPreChanged: function (evt, args)
	{
		for (let i = 0; i < this._list_property.length; i++)
		{
			if (this._list_property[i].name == args.name)
			{
				let trigger = true;

				switch (this._list_property[i].type)
				{
					case 'radio':
						if (this._list_property[i].value != args.value)
						{
							this._list_property[i].parentElement.classList.remove('active');
							continue;
						}

						this._list_property[i].checked = true;
						this._list_property[i].parentElement.classList.add('active');
						break;

					case 'checkbox':
						if (~~args.value)
						{
							this._list_property[i].checked = true;
							this._list_property[i].parentElement.classList.add('active');
						}
						else
						{
							this._list_property[i].checked = false;
							this._list_property[i].parentElement.classList.remove('active');
						}

						break;

					case 'field':
						this._list_property[i].setValue (args.value);
						trigger = false;
						break;

					default:
						this._list_property[i].value = args.value;

						if (this._list_property[i].value != args.value)
							trigger = false;

						break;
				}

				if (trigger && this._list_property[i].onchange)
					this._list_property[i].onchange();
			}
		}

		this.onModelPropertyChanged(evt, args);
	},

	/**
	**	Event handler invoked when a property of the model has changed. Automatically triggers an
	**	internal event named "propertyChanged.<propertyName>".
	**
	**	>> void onModelPropertyChanged (evt, args);
	*/
	onModelPropertyChanged: function (evt, args)
	{
		this.dispatch ("propertyChanged." + args.name, args);
		this.dispatch ("propertyChanged", args);
	},

	/**
	**	Event handler invoked when a property of the model is removed.
	**
	**	>> void onModelPropertyRemoved (evt, args);
	*/
	onModelPropertyRemoved: function (evt, args)
	{
	},

	/*
	**	Registers a new custom element with the specified name, extra functionality can be added with one or more prototypes, by default
	**	all elements also get the Rin.Element prototype. Note that the final prototypes of all registered elements are stored, and
	**	if you want to inherit another element's prototype just provide its name (string) in the protos argument list.
	**
	**	>> class register (string name, (object|string)... protos);
	*/
	register: function (name, ...protos)
	{
		var newElement = class extends HTMLElement
		{
			constructor()
			{
				super();
				this.invokeConstructor = true;

				this._super = { };

				for (let i of Object.entries(this.constructor.prototype._super))
				{
					this._super[i[0]] = { };

					for (let j of Object.entries(i[1])) {
						this._super[i[0]][j[0]] = j[1].bind(this);
					}
				}

				this.onCreated();
			}

			findRoot(srcElement)
			{
				let elem = srcElement ? srcElement : this.parentElement;

				while (elem != null)
				{
					if ("isRoot" in elem && elem.isRoot)
						return elem;

					elem = elem.parentElement;
				}

				return global;
			}

			connectedCallback()
			{
				if (this.dataset.ref)
				{
					let root = this.findRoot();
					if (root)
					{
						root[this.dataset.ref] = this;
						root.refs[this.dataset.ref] = this;

						this.root = root;
					}
				}

				if (this.invokeConstructor)
				{
					this.invokeConstructor = false;
					this.__ctor();
				}

				if (this.root)
					this.root.onRefAdded (this.dataset.ref);

				this.onConnected();
			}

			disconnectedCallback()
			{
				if (this.dataset.ref && this.root)
				{
					this.root.onRefRemoved (this.dataset.ref);

					root[this.dataset.ref] = null;
					root.refs[this.dataset.ref] = null;

					this.root = null;
				}

				this.onDisconnected();
			}
		};

		Rin.override (newElement.prototype, Element);

		const proto = { };
		const _super = { };
		const events = { };

		for (let i = 0; i < protos.length; i++)
		{
			if (!protos[i]) continue;

			if (Rin.typeOf(protos[i]) == 'string')
			{
				const name = protos[i];

				protos[i] = Element.protos[name];
				if (!protos[i]) continue;

				_super[name] = { };

				for (let f in protos[i])
				{
					if (Rin.typeOf(protos[i][f]) != 'function')
						continue;

					_super[name][f] = protos[i][f];
				}
			}

			if ('_super' in protos[i])
				Rin.override (_super, protos[i]._super);

			if ('events' in protos[i])
				Rin.override (events, protos[i].events);

			Rin.override (newElement.prototype, protos[i]);
			Rin.override (proto, protos[i]);
		}

		newElement.prototype._super = _super;
		newElement.prototype.events = events;

		proto._super = _super;

		customElements.define (name, newElement);
		Element.protos[name] = proto;

		return newElement;
	}
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"@rsthn/rin":13}],3:[function(require,module,exports){
/*
**	rin-front/elements
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

module.exports =
{
	Tabs: require('./elems/r-tabs')
};

},{"./elems/r-tabs":4}],4:[function(require,module,exports){
/*
**	rin-front/elems/r-tabs
**
**	Copyright (c) 2019-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*
	<r-tabs [data-container="div.tab-container"] [data-base-route="@"]>
		<a data-name="home">Home</a>
		<a data-name="users">Users</a>
		<a data-name="products">Products</a>
		<a data-name="account">Account</a>
	</r-tabs>

	<div class="tab-container">
		<div data-name="home">
			Home
		</div>

		<div data-name="users">
			Users
		</div>
	</div>
*/

let Element = require('../element');
let Router = require('../router');

Element.register ('r-tabs',
{
	/**
	**	Element events.
	*/
	events:
	{
		'click [data-name]': function (evt)
		{
			if (this.dataset.baseRoute)
			{
				window.location = "#" + this.dataset.baseRoute.replace('@', evt.source.dataset.name);
				return;
			}

			this.selectTab (evt.source.dataset.name);
		}
	},

	/**
	**	Initializes the Tabs element.
	*/
	init: function()
	{
		this._routeHandler = (evt, args) =>
		{
			if (!args.route.changed)
				return;

			this._showTab (args.tabName);
		};
	},

	/**
	**	Executed when the children of the element are ready.
	*/
	ready: function()
	{
		if ("container" in this.dataset)
			this.container = document.querySelector(this.dataset.container);
		else
			this.container = this.nextElementSibling;

		this._hideTabsExcept(null);
	},

	/**
	**	Adds a handler to Router if the data-base-route attribute was set.
	*/
	onConnected: function()
	{
		if (this.dataset.baseRoute)
			Router.addRoute (this.dataset.baseRoute.replace('@', ':tabName'), this._routeHandler);
	},

	/**
	**	Removes a handler previously added to Router if the data-base-route attribute was set.
	*/
	onDisconnected: function()
	{
		if (this.dataset.baseRoute)
			Router.removeRoute(this.dataset.baseRoute.replace('@', ':tabName'), this._routeHandler);
	},

	/**
	**	Hides all tabs except the one with the specified exceptName, if none specified then all tabs will be hidden (display: none), additionally
	**	the respective link item in the tab definition will have class 'active'.
	*/
	_hideTabsExcept: function (exceptName)
	{
		if (this.container == null) return;

		if (!exceptName) exceptName = '';

		for (let i = 0; i < this.container.children.length; i++)
		{
			if (this.container.children[i].dataset.name == exceptName)
			{
				if (this.container.children[i].style.display == 'none')
					this.dispatch('tab-activate', { el: this.container.children[i] });

				this.container.children[i].style.display = 'block';
			}
			else
			{
				if (this.container.children[i].style.display == 'block')
					this.dispatch('tab-deactivate', { el: this.container.children[i] });

				this.container.children[i].style.display = 'none';
			}
		}

		let links = this.querySelectorAll("[data-name]");

		for (let i = 0; i < links.length; i++)
		{
			if (links[i].dataset.name == exceptName)
				links[i].classList.add('active');
			else
				links[i].classList.remove('active');
		}
	},

	/**
	**	Shows the tab with the specified name.
	*/
	_showTab: function (name)
	{
		return this._hideTabsExcept (name);
	},

	/**
	**	Selects a tab given its name.
	*/
	selectTab: function (name)
	{
		if (this.dataset.baseRoute)
		{
			const hash = "#" + this.dataset.baseRoute.replace('@', name);

			if (window.location.hash != hash)
			{
				window.location = hash;
				return;
			}
		}

		this._showTab (name);
	}
});

},{"../element":2,"../router":6}],5:[function(require,module,exports){
/*
**	rin-front/main
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

module.exports =
{
	Router: require('./router'),
	Element: require('./element'),
	Api: require('./api'),

	Elements: require('./elements')
};

},{"./api":1,"./element":2,"./elements":3,"./router":6}],6:[function(require,module,exports){
(function (global){
/*
**	rin/router
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const { EventDispatcher } = require('@rsthn/rin');

/**
**	The Router is a special module that detects local URL changes (when a hash-change occurs) and
**	forwards events to the appropriate handlers.
*/

let _Router = module.exports =
{
	Route: EventDispatcher.extend
	({
		/**
		**	Regular expression for the route. This is generated from a simpler expression provided
		**	in the constructor.
		*/
		routeRegex: null,
	
		/**
		**	Original route string value.
		*/
		value: null,
	
		/**
		**	Map with the indices and the names of each paremeter obtained from the route expression.
		*/
		params: null,
	
		/**
		**	Arguments string obtained from the last route dispatch. Used to check if the arguments changed.
		*/
		s_args: null,
	
		/**
		**	Indicates if the route is active because of a past positive dispatch.
		*/
		active: false,
	
		/**
		**	Indicates if the route is active because of a past positive dispatch.
		*/
		changed: false,
	
		/**
		**	Constructor of the route, the specified argument is a route expression.
		**
		**	>> void __ctor (string route);
		*/
		__ctor: function (route)
		{
			this._super.EventDispatcher.__ctor();
			this._compileRoute (this.value = route);
		},
	
		/**
		**	Transforms the specified route expression into a regular expression and a set of parameter
		**	names and stores them in the 'param' array.
		**
		**	>> void _compileRoute (string route);
		*/
		_compileRoute: function (route)
		{
			this.params = [];
	
			while (true)
			{
				var m = /:([!@A-Za-z0-9_-]+)/.exec(route);
				if (!m) break;
	
				route = route.replace(m[0], "([^/]+)");
				this.params.push (m[1]);
			}
	
			this.routeRegex = "^" + route.replace(/##/g, "");
		},
	
		/**
		**	Adds a handler to the route dispatcher. The handler can be removed later using removeHandler and
		**	specifying the same parameters. If unrouted boolean is specified the event to listen to will be
		**	the unrouted event (when the route changes and the route is not activated).
		**
		**	void addHandler (handler: function, unrouted: bool);
		*/
		addHandler: function (handler, unrouted)
		{
			this.addEventListener ((unrouted === true ? "un" : "") + "routed", handler, null);
		},
	
		/**
		**	Removes a handler from the route dispatcher.
		**
		**	void removeHandler (handler: function, unrouted: bool);
		*/
		removeHandler: function (handler, unrouted)
		{
			this.removeEventListener ((unrouted === true ? "un" : "") + "routed", handler, null);
		},
	
		/**
		**	Verifies if the specified route matches the internal route and if so dispatches a "routed"
		**	event with the obtained parameters to all attached handlers.
		**
		**	bool dispatch (route: string);
		*/
		dispatch: function (route)
		{
			var matches = route.match (this.routeRegex);
			if (!matches)
			{
				this.s_args = null;
	
				if (this.active)
					this.dispatchEvent ("unrouted", { route: this });
	
				return this.active = false;
			}
	
			var args = { route: this };
			var str = "";
	
			for (var i = 0; i < this.params.length; i++)
			{
				args[this.params[i]] = matches[i+1];
				str += "_" + matches[i+1];
			}
	
			this.changed = str != this.s_args;
	
			this.dispatchEvent ("routed", args);
			this.s_args = str;
	
			return this.active = true;
		}
	}),

	/**
	**	Map with route objects. The key of the map is the route and the value a handler.
	*/
	routes: { },

	/**
	**	Sorted list of routes. Smaller routes are processed first than larger ones. This array stores
	**	only the keys to the Router.routes map.
	*/
	sortedRoutes: [ ],

	/**
	**	Indicates the number of times the onLocationChanged handler should ignore the hash change event.
	*/
	ignoreHashchangeEvent: 0,

	/**
	**	Current location.
	*/
	location: "",

	/**
	**	Current location as an array of elements (obtained by splitting the location by slash).
	*/
	args: [],

	/**
	**	Initializes the router global instance.
	**
	**	>> void init ();
	*/
	init: function ()
	{
		if (this.alreadyAttached)
			return;

		this.alreadyAttached = true;

		if ('onhashchange' in global)
			global.onhashchange = this.onLocationChanged.bind(this);
	},

	/**
	**	Refreshes the current route by forcing a hashchange event.
	**
	**	>> void refresh ();
	*/
	refresh: function ()
	{
		this.onLocationChanged();
	},

	/**
	**	Changes the current location and optionally prevents a trigger of the hashchange event.
	**
	**	>> void setRoute (string route[, bool silent]);
	*/
	setRoute: function (route, silent)
	{
		var location = _Router.realLocation (route);
		if (location == this.location) return;

		if (silent) this.ignoreHashchangeEvent++;
		global.location.hash = location;
	},

	/**
	**	Adds the specified route to the routing map.
	**
	**	>> void addRoute (string route, function onRoute);
	**	>> void addRoute (string route, function onRoute, function onUnroute);
	*/
	addRoute: function (route, onRoute, onUnroute)
	{
		if (!this.routes[route])
		{
			this.routes[route] = new _Router.Route (route);
			this.sortedRoutes.push (route);

			this.sortedRoutes.sort (function(a, b) {
				return _Router.routes[a].routeRegex.length - _Router.routes[b].routeRegex.length;
			});
		}

		if (onUnroute !== undefined)
		{
			this.routes[route].addHandler (onRoute, false);
			this.routes[route].addHandler (onUnroute, true);
		}
		else
			this.routes[route].addHandler (onRoute, false);
	},

	/**
	**	Adds the specified routes to the routing map. The routes map should contain the route expression
	**	in the key of the map and a handler function in the value.
	**
	**	>> void addRoutes (routes: map);
	*/
	addRoutes: function (routes)
	{
		for (var i in routes)
		{
			if (!this.routes[i])
			{
				this.routes[i] = new _Router.Route (i);
				this.sortedRoutes.push (i);
			}

			this.routes[i].addHandler (routes[i], false);
		}

		this.sortedRoutes.sort (function(a, b) {
			return _Router.routes[a].routeRegex.length - _Router.routes[b].routeRegex.length;
		});
	},

	/**
	**	Removes the specified route from the routing map.
	**
	**	>> void removeRoute (string route, function onRoute);
	**	>> void removeRoute (string route, function onRoute, function onUnroute);
	*/
	removeRoute: function (route, onRoute, onUnroute)
	{
		if (!this.routes[route]) return;

		if (onUnroute !== undefined)
		{
			this.routes[route].removeHandler (onRoute, false);
			this.routes[route].removeHandler (onUnroute, true);
		}
		else
			this.routes[route].removeHandler (onRoute);
	},

	/**
	**	Removes the specified routes from the routing map. The routes map should contain the route
	**	expression in the key of the map and a handler function in the value.
	**
	**	>> void removeRoutes (routes: map);
	*/
	removeRoutes: function (routes)
	{
		for (var i in routes)
		{
			if (!this.routes[i]) continue;

			this.routes[i].removeHandler (routes[i]);
		}
	},

	/**
	**	Given a formatted location and a previous one it will return the correct real location.
	**
	**	string realLocation (cLocation: string, pLocation: string);
	*/
	realLocation: function (cLocation, pLocation)
	{
		if (!pLocation) pLocation = this.location;
		if (!pLocation) pLocation = " ";

		var state = 0, i = 0, j = 0, k;
		var rLocation = "";

		while (state != -1 && i < cLocation.length && j < pLocation.length)
		{
			switch (state)
			{
				case 0:
					if (cLocation.substr(i++, 1) == "*")
					{
						state = 1;
						break;
					}

					if (cLocation.substr(i-1, 1) != pLocation.substr(j++, 1))
					{
						rLocation += cLocation.substr(i-1);
						state = -1;
						break;
					}

					rLocation += pLocation.substr(j-1, 1);
					break;

				case 1:
					if (cLocation.substr(i, 1) == "*")
					{
						state = 3;
						i++;
						break;
					}

					state = 2;
					break;

				case 2:
					k = pLocation.indexOf(cLocation.substr(i, 1), j);
					if (k == -1)
					{
						rLocation += pLocation.substr(j) + cLocation.substr(i);
						state = -1;
						break;
					}

					rLocation += pLocation.substr(j, k-j);

					state = 0;
					j = k;
					break;

				case 3:
					k = pLocation.lastIndexOf(cLocation.substr(i, 1));
					if (k == -1)
					{
						rLocation += cLocation.substr(i);
						state = -1;
						break;
					}

					rLocation += pLocation.substr(j, k-j);

					state = 0;
					j = k;
					break;
			}
		}

		if (state != -1)
			rLocation += cLocation.substr(i);

		return rLocation.trim();
	},

	/**
	**	Event handler for when the location hash changes.
	*/
	onLocationChanged: function ()
	{
		var cLocation = location.hash.substr(1);
		var rLocation = _Router.realLocation (cLocation);

		if (cLocation != rLocation)
		{
			global.location.replace("#" + rLocation);
			return;
		}

		this.location = cLocation;
		this.args = this.location.split ("/");

		if (this.ignoreHashchangeEvent > 0)
		{
			this.ignoreHashchangeEvent--;
			return;
		}

		for (var i = 0; i < this.sortedRoutes.length; i++)
			this.routes[this.sortedRoutes[i]].dispatch (this.location);
	}
};

_Router.init();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"@rsthn/rin":13}],7:[function(require,module,exports){
/*
**	rin/alpha
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let Rin = module.exports = { };

/**
**	Invokes the specified function 'fn' 10ms later.
**
**	>> void invokeLater (function fn);
*/
Rin.invokeLater = function (fn)
{
	if (fn) setTimeout (function() { fn(); }, 10);
};


/**
**	Returns the type of an element 'o', properly detects arrays and null types. The return string is always in lowercase.
**
**	>> string typeOf (any o);
*/
Rin.typeOf = function (o)
{
	if (o instanceof Array)
		return "array";

	if (o === null)
		return "null";

	return (typeof(o)).toString().toLowerCase();
};


/**
**	Returns boolean indicating if the type of the element is an array or an object.
**
**	>> bool isArrayOrObject (any o);
*/
Rin.isArrayOrObject = function (o)
{
	switch (Rin.typeOf(o))
	{
		case "array": case "object":
			return true;
	}

	return false;
};


/**
**	Creates a clone (deep copy) of the specified element. The element can be an array, an object or a primitive type.
**
**	>> T clone (T elem);
*/
Rin.clone = function (elem)
{
	var o;

	if (Rin.typeOf(elem) == "array")
	{
		o = [ ];

		for (let i = 0; i < elem.length; i++)
			o.push (Rin.clone(elem[i]));
	}
	else if (Rin.typeOf(elem) == "object")
	{
		o = { };

		for (let i in elem)
			o[i] = Rin.clone(elem[i]);
	}
	else
	{
		o = elem;
	}

	return o;
};


/**
**	Merges all given elements into the first one, object fields are cloned.
**
**	>> T merge (T... elems)
*/
Rin.merge = function (output, ...objs)
{
	if (Rin.typeOf(output) == "array")
	{
		for (let i = 0; i < objs.length; i++)
		{
			let arr = objs[i];

			if (Rin.typeOf(arr) != "array")
			{
				output.push(arr);
			}
			else
			{
				for (let j = 0; j < arr.length; j++)
				{
					output.push(Rin.clone(arr[j]));
				}
			}
		}
	}
	else if (Rin.typeOf(output) == "object")
	{
		for (let i = 0; i < objs.length; i++)
		{
			let obj = objs[i];
			if (Rin.typeOf(obj) != "object") continue;

			for (let field in obj)
			{
				if (Rin.isArrayOrObject(obj[field]))
				{
					if (field in output)
						Rin.merge(output[field], obj[field]);
					else
						output[field] = Rin.clone(obj[field]);
				}
				else
					output[field] = obj[field];
			}
		}
	}

	return output;
};


/**
**	Assigns all fields from the specified objects into the first one.
**
**	>> object override (object output, object... objs)
*/
Rin.override = function (output, ...objs)
{
	for (let i = 0; i < objs.length; i++)
	{
		for (let j in objs[i])
		{
			output[j] = objs[i][j];
		}
	}

	return output;
};


/*
**	Compares two objects and returns `true` if all properties in "partial" find a match in "full".
*/
Rin.partialCompare = function (full, partial)
{
	if (full == null || partial == null) return false;

	if (full === partial)
		return true;

	for (var i in partial)
	{
		if (full[i] != partial[i])
			return false;
	}

	return true;
};


/*
**	Performs a partial search for an object (o) in the specified array and returns its index or `false` if the
**	object was not found. When `getObject` is set to `true` the object will be returned instead of an index, or
**	`null` if not found.
*/
Rin.arrayFind = function (arr, o, getObject)
{
	for (var i = 0; arr && i < arr.length; i++)
	{
		if (this.partialCompare (arr[i], o))
			return getObject ? arr[i] : i;
	}

	return getObject ? null : false;
};


/*
**	Traverses the given object attempting to find the index/key that does an identical match with the specified value,
**	if not found returns -1, otherwise the index/key where the value was found.
**
**	>> int indexOf (array container, T value)
**	>> string indexOf (object container, T value)
*/
Rin.indexOf = function (container, value)
{
	for (let i in container)
	{
		if (container[i] == value)
			return i;
	}

	return -1;
};


/**
**	Escapes a string using HTML entities.
**
**	>> string escape (string str);
*/
Rin.escape = function (str)
{
	return (str+"").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};


/**
**	Verifies if the specified object is of class `m`, if not it will create a new instance of `m` passing `o` as parameter.
**
**	>> object ensureTypeOf (class m, object o);
*/
Rin.ensureTypeOf = function (m, o)
{
	if (!o || !m || o instanceof m)
		return o;

	if (o.isInstanceOf && m.prototype.className)
	{
		if (o.isInstanceOf (m.prototype.className))
			return o;
	}

	return new m (o);
};


/**
**	Serializes an object and returns its JSON string representation.
**
**	>> string serialize (object o);
*/
Rin.serialize = function (o)
{
	return JSON.stringify(o);
};


/**
**	Deserializes a string in JSON format and returns the result.
**
**	>> any deserialize (string s);
*/
Rin.deserialize = function (s)
{
	return JSON.parse(s);
};

},{}],8:[function(require,module,exports){
/*
**	rin/class
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let Rin = require('./alpha');

/**
**	Base class used to easily create classes and sub-classes with complex multiple inheritance and
**	support for calls to parent class methods.
*/

module.exports = Class = function ()
{
};


/**
**	Reference to the class itself.
*/
Class._class = Class;


/**
**	Contains the methods of each of the super classes.
*/
Class._super = { };


/**
**	Name of the class, if none specified the class will be considered "final" and will not be inheritable.
*/
Class.prototype.className = "Class";


/**
**	Class constructor, should initialize the state of the instance. Invoked when the `new` keyword is used with the class.
*/
Class.prototype.__ctor = function ()
{
};


/**
**	Class destructor, should clear the instance state and release any used resources, invoked when the global `dispose`
**	function is called with the instance as parameter.
*/
Class.prototype.__dtor = function ()
{
};


/**
**	Returns true if the object is an instance of the specified class (verifies inheritance), the `class` parameter can be a class
**	name, a class constructor or a class instance, in any case the appropriate checks will be done.
**
**	>> bool isInstanceOf (string className);
**	>> bool isInstanceOf (constructor classConstructor);
**	>> bool isInstanceOf (object classInstance);
*/
Class.prototype.isInstanceOf = function (className)
{
	className = Rin.typeOf(className) == "string" ? className : (className.prototype ? className.prototype.className : className.constructor.prototype.className);
	return className in this._super ? true : this.className == className;
};


/**
**	Internal method to ensure the _super field of an instance is ready to be used.
**
**	>> void _initSuperRefs ();
*/
Class.prototype._initSuperRefs = function ()
{
	var _super = this.constructor._super;
	var _newSuper = { };

	for (let i in _super)
	{
		let o = { };

		let _prot = _super[i].prototype;
		for (let j in _prot)
		{
			if (Rin.typeOf(_prot[j]) == "function")
				o[j] = _prot[j].bind(this);
		}

		_newSuper[i] = o;
	}

	this._super = _newSuper;
};


/**
**	Extends the class with the specified prototype. The prototype can be a function (class constructor) or an object. Note that the
**	class will be modified (and returned) instead of creating a new class. Must be called at the class-level (**not** instance level).
**	When a class is provided all fields starting with uppercase at the class-level will not be inherited, this is used to create constants
**	on classes without having them to be copied to derived classes.
**
**	>> class inherit (constructor classConstructor);
**	>> class inherit (object obj);
*/
Class.inherit = function (proto)
{
	var self = this._class;

	var _super = self._super;
	var _class = self._class;

	if (Rin.typeOf(proto) == "function")
	{
		// Move constants (uppercased properties) to the class-level instead of prototype-level.
		for (let i in proto._class)
			if (!/^[A-Z]/.test(i)) self[i] = proto._class[i];

		// Combine methods and properties.
		Rin.override (self.prototype, proto._class.prototype);

		// Combine super methods.
		Rin.override (_super, proto._class._super);

		// Add new super reference if className specified in inherited prototypes.
		if (proto._class.prototype.className)
			_super[proto._class.prototype.className] = proto._class;
	}
	else
	{
		Rin.override (self.prototype, proto);
	}

	self._super = _super;
	self._class = _class;

	return self;
};


/**
**	Internal method used to extend a class with one or more prototypes.
**
**	>> class _extend (object base, object[] protos);
*/
Class.prototype._extend = function (base, protos)
{
	var _class = function (...args)
	{
		this._initSuperRefs();
		this.__ctor.apply(this, args);
	};

	_class._class = _class;
	_class._super = { };

	Class.inherit.call (_class, base);

	delete _class.prototype.className;

	for (let i = 0; i < protos.length; i++)
		_class.inherit (protos[i]);

	delete _class._super.Class;

	if ("classInit" in _class.prototype)
		_class.prototype.classInit();

	return _class;
};


/**
**	Creates a new class with the specified prototypes each of which can be a class constructor or an object.
**
**	>> constructor extend (object... protos);
*/
Class.extend = function (...protos)
{
	return this._class.prototype._extend (this, protos);
};


/**
**	Creates a new instance of a class resulting from extending the self class with the specified prototype.
**
**	>> object create (object proto);
*/
Class.create = function (proto)
{
	return new (this.extend(proto)) ();
};

},{"./alpha":7}],9:[function(require,module,exports){
/*
**	rin/collection
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let Flattenable = require('./flattenable');
let Schema = require('./schema');
let Rin = require('./alpha');

/**
**	Flattenable collection class, used to store items and manipulate them. The items should also be flattenable.
*/

module.exports = Flattenable.extend
({
	/**
	**	Name of the class.
	*/
	className: "Collection",

	/**
	**	Describes the type schema of the underlying items.
	*/
	itemTypeSchema: null,

	/**
	**	Array of items.
	*/
	items: null, /* Array */

	/**
	**	Constructs the collection.
	*/
	__ctor: function (itemTypeSchema)
	{
		if (!itemTypeSchema) itemTypeSchema = this.itemTypeSchema;

		if (itemTypeSchema)
			this.typeSchema = Schema.Property('items').is(Schema.Array().of(itemTypeSchema));

		this.reset();
	},

	/*
	**	Executed after the collection has been unflattened, re-adds the items to ensure onItemAdded() is called.
	*/
	onUnflattened: function()
	{
		let items = this.items;
		this.reset();

		for (let i of items)
			this.add(i);
	},

	/*
	**	Resets the collection to empty. Note that onItemRemoved will not be called.
	*/
	reset: function ()
	{
		this.items = [];
		return this;
	},

	/*
	**	Clears the contents of the collection.
	*/
	clear: function ()
	{
		var items = this.items;
		this.reset();

		for (var i = 0; i < items.length; i++)
			this.onItemRemoved (items[i], 0);

		return this;
	},

	/*
	**	Sorts the collection. A comparison function should be provided, or the name of a property to sort by.
	**
	**	Object sort (fn: Function)
	**	Object sort (prop: string, [desc:bool=false])
	*/
	sort: function (fn, desc)
	{
		if (typeof(fn) != "function")
		{
			this.items.sort(function(a, b)
			{
				return (a[fn] <= b[fn] ? -1 : 1) * (desc === true ? -1 : 1);
			});
		}
		else
			this.items.sort(fn);

		return this;
	},

	/*
	**	Searches for an item with the specified fields and returns it. The "inc" object is the "inclusive" map, meaning all fields must match
	**	and the optional "exc" is the exclusive map, meaning not even one field should match.
	**
	**	Object findItem (inc: Object, exc: Object);
	*/	
	findItem: function (inc, exc)
	{
		if (!this.items) return null;

		for (var i = 0; i < this.items.length; i++)
		{
			if (exc && Rin.partialCompare(this.items[i], exc))
				continue;

			if (Rin.partialCompare(this.items[i], inc))
				return this.items[i];
		}

		return null;
	},

	/*
	**	Returns the container array.
	*/
	getItems: function ()
	{
		return this.items;
	},

	/*
	**	Returns the number of items in the collection.
	*/
	count: function ()
	{
		return this.items.length;
	},

	/*
	**	Returns true if the collection is empty.
	*/
	isEmpty: function ()
	{
		return !this.items.length;
	},

	/*
	**	Adds an item to the collection, onBeforeItemAdded and onItemAdded will be triggered.
	*/
	add: function (item)
	{
		if (!item || !this.onBeforeItemAdded(item))
			return this;

		this.items.push (item);
		this.onItemAdded (item);

		return this;
	},

	/*
	**	Adds an item at the specified index, effectively moving the remaining items to the right.
	*/
	addAt: function (index, item)
	{
		if (!item || !this.onBeforeItemAdded (item))
			return this;

		if (index < 0) index = 0;
		if (index > this.items.length) index = this.items.length;

		if (index == 0)
		{
			this.items.unshift(item);
		}
		else if (index == this.items.length)
		{
			this.items.push(item);
		}
		else
		{
			var tmp = this.items.splice(0, index);
			tmp.push(item);

			this.items = tmp.concat(this.items);
		}

		this.onItemAdded (item);
		return this;
	},

	/*
	**	Traverses the given array and adds all items to the collection.
	*/
	addItems: function (list)
	{
		if (!list) return this;

		for (var i = 0; i < list.length; i++)
			this.add (list[i]);

		return this;
	},

	/*
	**	Returns the index of the specified item, or -1 if not found.
	*/
	indexOf: function (item)
	{
		return this.items.indexOf(item);
	},

	/*
	**	Returns the item at the specified index, or null if not found.
	*/
	getAt: function (index, rel)
	{
		if (index < 0 && rel == true)
			index += this.items.length;

		return index >= 0 && index < this.items.length ? this.items[index] : null;
	},

	/*
	**	Removes the item at the specified index.
	*/
	removeAt: function (index)
	{
		if (index < 0 || index >= this.items.length)
			return this;

		var item = this.items[index];

		this.items.splice (index, 1);

		this.onItemRemoved (item, index);
		return this;
	},

	/*
	**	Removes the specified item.
	*/
	remove: function (item)
	{
		this.removeAt (this.indexOf(item));
	},

	/*
	**	Runs the specified callback for each of the items in the collection, if false is returned by the callback this function
	**	will exit immediately. Parameters to the callback are: (item, index, collection).
	*/
	forEach: function (callback)
	{
		if (this.isEmpty())
			return this;

		for (var i = 0; i < this.items.length; i++)
			if (callback (this.items[i], i, this) === false) break;

		return this;
	},

	/*
	**	Executes a method call with the specified parameters on each of the items in the collection, if false is returned by the
	**	item's method this function will exit immediately.
	*/
	forEachCall: function (method, ...args)
	{
		if (this.isEmpty())
			return this;

		for (var i = 0; i < this.items.length; i++)
			if (this.items[i][method] (...args) === false) break;

		return this;
	},

	/*
	**	Exactly the same as forEach but in reverse order.
	*/
	forEachRev: function (callback)
	{
		if (this.isEmpty())
			return this;

		for (var i = this.items.length-1; i >= 0; i--)
			if (callback (this.items[i], i, this) === false) break;

		return this;
	},

	/*
	**	Exactly the same as forEachCall but in reverse order.
	*/
	forEachRevCall: function (method, ...args)
	{
		if (this.isEmpty())
			return this;

		for (var i = this.items.length-1; i >= 0; i--)
			if (this.items[i][method] (...args) === false) break;

		return this;
	},

	/*
	**	Handler for the beforeItemAdded event. If returns false the item will not be added.
	*/
	onBeforeItemAdded: function (item)
	{
		return true;
	},

	/*
	**	Handler for the itemAdded event.
	*/
	onItemAdded: function (item)
	{
	},

	/*
	**	Handler for the itemRemoved event.
	*/
	onItemRemoved: function (item)
	{
	}
});

},{"./alpha":7,"./flattenable":12,"./schema":18}],10:[function(require,module,exports){
/*
**	rin/event-dispatcher
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let Class = require('./class');
let Event = require('./event');

/**
**	Event dispatcher allows several event listeners to be attached, these will be invoked whenever the
**	event that is being listened to is triggered.
*/

module.exports = Class.extend
({
	/**
	**	Name of the class.
	*/
	className: "EventDispatcher",

	/**
	**	Listeners attached to this event dispatcher. Grouped by event name.
	*/
	listeners: null,

	/**
	**	Initializes the event dispatcher.
	**
	**	EventDispatcher __ctor ();
	*/
	__ctor: function ()
	{
		this.listeners = { };
	},

	/**
	**	Adds an event listener for a specified event to the event dispatcher. The event name can have an optional
	**	namespace indicator which is added to the beginning of the event name and separated using a colon (:). This
	**	indicator can be used to later trigger or remove all handlers of an specific namespace.
	**
	**	EventDispatcher addEventListener (eventName: string, handler: function, context: object, data: object);
	*/
	addEventListener: function (eventName, handler, context, data)
	{
		eventName = eventName.split(":");
		var name = eventName[eventName.length-1];
		var ns = eventName.length > 1 ? eventName[0] : null;

		if (!this.listeners[name])
			this.listeners[name] = [];

		this.listeners[name].push ({ ns: ns, handler: handler, context: context, data: data, silent: 0 });
		return this;
	},

	/**
	**	Removes an event listener from the event dispatcher. If only the name is provided all handlers with the
	**	specified name will be removed. If a context is provided without a handler then any handler matching the
	**	context will be removed. Special event name "*" can be used to match all event names.
	**
	**	EventDispatcher removeEventListener (eventName: string, handler: function, context: object);
	*/
	removeEventListener: function (eventName, handler, context)
	{
		eventName = eventName.split(":");
		var name = eventName[eventName.length-1];
		var ns = eventName.length > 1 ? eventName[0] : null;

		if (name == "*")
		{
			for (var j in this.listeners)
			{
				var list = this.listeners[j];

				for (var i = 0; i < list.length; i++)
				{
					var k = true;

					if (handler)
						k = k && list[i].handler === handler;

					if (context)
						k = k && list[i].context === context;

					if (ns)
						k = k && list[i].ns == ns;

					if (k) list.splice(i--, 1);
				}
			}
		}
		else
		{
			if (!this.listeners[name])
				return this;

			var list = this.listeners[name];

			for (var i = 0; i < list.length; i++)
			{
				var k = true;

				if (handler)
					k = k && list[i].handler === handler;

				if (context)
					k = k && list[i].context === context;

				if (ns)
					k = k && list[i].ns == ns;

				if (k) list.splice(i--, 1);
			}
		}

		return this;
	},

	/**
	**	Prepares an event with the specified parameters for its later usage. The event is started when
	**	the resume() method is called. If a callback is specified it will be executed once all event
	**	handlers have been processed.
	**
	**	Event prepareEvent (eventName: string, eventArgs: map, cbHandler: function, cbContext: object);
	**	Event prepareEvent (eventName: string, eventArgs: map);
	*/
	prepareEvent: function (eventName, eventArgs, cbHandler, cbContext)
	{
		var list = [];

		eventName = eventName.split(":");
		var name = eventName[eventName.length-1];
		var ns = eventName.length > 1 ? eventName[0] : null;

		if (this.listeners[name])
			list = list.concat (this.listeners[name]);

		if (this.listeners["*"])
			list = list.concat (this.listeners["*"]);

		for (var i = 0; i < list.length; i++)
			if (list[i].silent) list.splice (i--, 1);

		if (ns)
		{
			for (var i = 0; i < list.length; i++)
				if (list[i].ns != ns) list.splice (i--, 1);
		}

		return new Event (this, list, name, eventArgs, cbHandler, cbContext);
	},

	/**
	**	Silences or unsilences all handlers attached to an event such that if the event fires the handler(s) will
	**	not be invoked. It is recommended to use a namespace to ensure other handlers will continue to be run.
	**
	**	EventDispatcher silence (eventName: string);
	*/
	silence: function (eventName, value)
	{
		eventName = eventName.split(":");

		var name = eventName[eventName.length-1];
		var ns = eventName.length > 1 ? eventName[0] : null;

		value = value === false ? -1 : 1;

		if (name == "*")
		{
			for (var j in this.listeners)
			{
				var list = this.listeners[j];

				for (var i = 0; i < list.length; i++)
				{
					if (ns && list[i].ns != ns)
						continue;

					list[i].silent += value;
				}
			}
		}
		else
		{
			if (!this.listeners[name])
				return this;

			var list = this.listeners[name];

			for (var i = 0; i < list.length; i++)
			{
				if (ns && list[i].ns != ns)
					continue;

				list[i].silent += value;
			}
		}

		return this;
	},

	/**
	**	Dispatches an event to the respective listeners. If a callback is specified it will be executed once
	**	all event handlers have been processed.
	**
	**	Event dispatchEvent (eventName: string, eventArgs: map, cbHandler: function, cbContext: object);
	**	Event dispatchEvent (eventName: string, eventArgs: map);
	*/
	dispatchEvent: function (eventName, eventArgs, cbHandler, cbContext)
	{
		return this.prepareEvent(eventName, eventArgs, cbHandler, cbContext).resume();
	}
});

},{"./class":8,"./event":11}],11:[function(require,module,exports){
(function (global){
/*
**	rin/event
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let Rin = require('./alpha');
let Class = require('./class');

/**
**	Holds the information about a triggered event. It also provides a mechanism to allow asynchronous
**	event propagation to ensure the event chain order.
*/

module.exports = Class.extend
({
	/**
	**	Name of the class.
	*/
	className: "Event",

	/**
	**	Source of the event.
	*/
	source: null,

	/**
	**	Name of the event.
	*/
	name: null,

	/**
	**	Arguments of the event.
	*/
	args: null,

	/**
	**	Indicates if the last event handler wants to use async mode.
	*/
	_async: false,

	/**
	**	Queue of all handlers to invoke.
	*/
	list: null,

	/**
	**	Next event to be executed in the event chain.
	*/
	next: null,

	/**
	**	Return values from event handlers.
	*/
	ret: null,

	/**
	**	Original root event.
	*/
	original: null,

	/**
	**	Index of the current event handler.
	*/
	i: -1,

	/**
	**	Contructs an event object with the specified parameters. Source is the event-dispatcher object, list is
	**	an array with all the listeners to invoke. The eventName and eventArgs are the event information to be
	**	passed to each handler and if a callback is specified (cbHandler+cbContext) it will be executed once all
	**	the event handlers have been processed.
	**
	**	Event __ctor (source: EventDispatcher, list: Array, eventName: string, eventArgs: map, cbHandler: function, cbContext: object);
	*/
	__ctor: function (source, list, eventName, eventArgs, cbHandler, cbContext)
	{
		this.source = source;

		this.name = eventName;
		this.args = eventArgs;

		this.cbHandler = cbHandler;
		this.cbContext = cbContext;

		this.list = list;
		this.reset();
	},

	/**
	**	Resets the event to its initial state. An event object can be reused by resetting it and then
	**	invoking the resume event.
	**
	**	Event reset ();
	*/
	reset: function ()
	{
		this.next = null;
		this.ret = [];

		this._async = false;
		this.i = -1;

		return this;
	},

	/**
	**	Sets the internal asynchronous flag. Should be called before a handler returns. If a handler
	**	calls this method it should also call resume() when async operations are finished.
	**
	**	Event wait ();
	*/
	wait: function ()
	{
		this._async = true;
		return this;
	},

	/**
	**	Resumes event propagation. Should be called manually by event handlers that also call wait().
	**
	**	Event resume ();
	*/
	resume: function ()
	{
		this._async = false;

		while (!this._async)
		{
			if (++this.i >= this.list.length)
				break;

			if (this.list[this.i].silent)
				continue;

			if (Rin.typeOf(this.list[this.i].handler) == "string")
			{
				if (this.list[this.i].context)
				{
					if (!this.list[this.i].context[this.list[this.i].handler])
						continue;

					if (this.list[this.i].context[this.list[this.i].handler] (this, this.args, this.list[this.i].data) === false)
						break;
				}
				else
				{
					if (global[this.list[this.i].handler].call (null, this, this.args, this.list[this.i].data) === false)
						break;
				}
			}
			else
			{
				if (this.list[this.i].handler.call (this.list[this.i].context, this, this.args, this.list[this.i].data) === false)
					break;
			}
		}

		if (this._async)
			return this;

		if (this.i >= this.list.length && this.next) this.next.resume();

		if (this.cbHandler)
			this.cbHandler.call (this.cbContext);

		return this;
	},

	/**
	**	Sets the "original" property of the event to indicate where the original event comes from.
	**
	**	Event from (event: Event);
	*/
	from: function (event)
	{
		this.original = event;
		return this;
	},

	/**
	**	Enqueues the specified event to be executed upon the current event process is finished. The "original"
	**	property of the chained event will be set to the current event.
	**
	**	Event enqueueEvent (event: Event);
	*/
	enqueue: function (event)
	{
		if (!event) return this;

		var evt;
		for (evt = this; evt.next != null; evt = evt.next);

		evt.next = event;
		event.from (this);

		return this;
	}
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./alpha":7,"./class":8}],12:[function(require,module,exports){
/*
**	rin/flattenable
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let Class = require('./class');

/**
**	Class used to add flattening and unflattening capabilities to any object. A "flat" object is an object composed
**	only of native types, that is: `null,` `boolean`, `integer`, `number`, `array` or `object`.
*/

module.exports = Class.extend
({
	/**
	**	Name of the class.
	*/
	className: "Flattenable",

	/**
	**	Type schema used to flatten/unflatten the contents of this class. See Schema class for more information.
	*/
	typeSchema: null,

	/**
	**	Returns the flattened contents of the object.
	*/
	flatten: function (context)
	{
		return this.typeSchema.flatten(this, context);
	},

	/**
	**	Unflattens the given object and overrides the local contents.
	*/
	unflatten: async function (value, context)
	{
		Object.assign(this, await this.typeSchema.unflatten(value, context));
		await this.onUnflattened();
		return this;
	},

	/*
	**	Executed when the unflatten() method is called on the object.
	*/
	onUnflattened: async function ()
	{
	}
});

},{"./class":8}],13:[function(require,module,exports){
/*
**	rin/main
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let Rin = require('./alpha');

Rin.Rin = Rin;
Rin.Class = require('./class');

Rin.Event = require('./event');
Rin.EventDispatcher = require('./event-dispatcher');

Rin.Model = require('./model');
Rin.Model.List = require('./model-list');

Rin.Schema = require('./schema');
Rin.Flattenable = require('./flattenable');
Rin.Collection = require('./collection');

Rin.Template = require('./template');

/* ---- */
Object.assign (module.exports, Rin);

},{"./alpha":7,"./class":8,"./collection":9,"./event":11,"./event-dispatcher":10,"./flattenable":12,"./model":17,"./model-list":15,"./schema":18,"./template":19}],14:[function(require,module,exports){
/*
**	rin/model-constraints
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let Rin = require('./alpha');
let Regex = require('./model-regex');

/**
**	Map of model constraint handlers. Each function should accept parameters (in order): the model object (model), the constraint value (ctval),
**	the property name (name), the property value (value) and return the corrected value once verified or throw an exception if errors occur.
*/

module.exports =
{
	/**
	**	Utility function (not a handler) to get the real value given a reference string. If the value is not a string, the value itself will
	**	be returned, if it is a string starting with '#' the model property will be returned, if starts with '@' the object property will be
	**	returned, otherwise the contents of the string will eval'd and returned.
	*/
	_getref: function (value, obj)
	{
		if (typeof(value) == "string")
		{
			if (value.substr(0, 1) == "#")			value = obj.get(value.substr(1));
			else if (value.substr(0, 1) == "@")		value = obj[value.substr(1)];

			if (typeof(value) == "string")
				return eval(value);

			return value;
		}
		else
			return value;
	},


	/**
	**	Verifies that the new value is of the valid type before storing it on the property. When possible if the
	**	input is of compatible type it will be converted to the target type.
	*/
	type: function (model, ctval, name, value)
	{
		switch (ctval)
		{
			case "int":
				value = parseInt(value);
				if (isNaN(value)) throw new Error (ctval);
				break;

			case "float":
				value = parseFloat(value);
				if (isNaN(value)) throw new Error (ctval);
				break;

			case "string":
				value = (value === null || value === undefined) ? "" : value.toString();
				break;

			case "bit":
				if (value === true || value === false) {
					value = value ? 1 : 0;
					break;
				}

				value = parseInt(value);
				if (isNaN(value)) throw new Error (ctval);

				value = value ? 1 : 0;
				break;

			case "array":
				if (Rin.typeOf(value) == "array")
					break;

				if (value === null || value === undefined)
				{
					value = [];
					break;
				}

				throw new Error (ctval);
				break;

			case "bool":
				if (value === "true" || value === true) {
					value = true;
					break;
				}

				if (value === "false" || value === false) {
					value = false;
					break;
				}

				throw new Error (ctval);
				break;
		}

		return value;
	},


	/**
	**	Verifies that the field is of the specified model type.
	*/
	model: function (model, ctval, name, value)
	{
		var mclass = this._getref(ctval, model);
		if (!mclass) throw new Error (ctval);

		if (!value)
			return new mclass();

		return mclass.ensure (value);
	},


	/**
	**	Verifies that the field is of the specified class.
	*/
	cls: function (model, ctval, name, value)
	{
		var mclass = this._getref(ctval, model);
		if (!value) return new mclass();

		return Rin.ensureTypeOf(mclass, value);
	},


	/**
	**	Verifies that the array contents are of the specified class. Returns error if the class does not exist
	**	or if the field is not an array. Therefore a type:array constraint should be used before this one.
	*/
	arrayof: function (model, ctval, name, value)
	{
		var mclass = this._getref(ctval, model);
		if (!value) value = [];

		if (!mclass || Rin.typeOf(value) != "array")
			throw new Error (ctval);

		for (var i = 0; i < value.length; i++)
			value[i] = Rin.ensureTypeOf(mclass, value[i]);
		
		return value;
	},


	/**
	**	Verifies that the array contents are not null. Returns error if the field is not an array, therefore a
	**	type:array constraint should be used before this one.
	*/
	arraynull: function (model, ctval, name, value)
	{
		var remove = false;

		if (Rin.typeOf(ctval) == "object")
		{
			if (ctval.remove) remove = ctval.remove;
			ctval = ctval.value;
		}

		if (ctval) return value;

		if (Rin.typeOf(value) != "array")
			throw new Error (ctval);

		for (var i = 0; i < value.length; i++)
		{
			if (value[i] == null)
			{
				if (remove)
					value.splice (i--, 1);
				else
					throw new Error (ctval);
			}
		}

		return value;
	},


	/**
	**	Verifies that the array contents are all compliant. Returns error if the field is not an array, therefore
	**	a type:array constraint should be used before this one.
	*/
	arraycompliant: function (model, ctval, name, value)
	{
		var remove = false;

		if (Rin.typeOf(ctval) == "object")
		{
			if (ctval.remove) remove = ctval.remove;
			ctval = ctval.value;
		}

		if (!ctval) return value;

		if (Rin.typeOf(value) != "array")
			throw new Error (ctval);

		for (var i = 0; i < value.length; i++)
		{
			if (value[i] == null)
				continue;

			if (!value[i].isCompliant())
			{
				if (remove)
					value.splice (i--, 1);
				else
					throw new Error (ctval);
			}
		}

		return value;
	},


	/**
	**	Verifies the presense of the field.
	*/
	required: function (model, ctval, name, value)
	{
		if (value === null || value === undefined)
			throw new Error (ctval ? "" : "null");

		switch (Rin.typeOf(value))
		{
			case "array":
				if (value.length == 0) throw new Error (ctval ? "" : "null");
				break;

			default:
				if (value.toString().length == 0) throw new Error (ctval ? "" : "null");
				break;
		}

		return value;
	},


	/**
	**	Verifies the minimum length of the field.
	*/
	minlen: function (model, ctval, name, value)
	{
		if (value.toString().length < ctval)
			throw new Error (ctval);

		return value;
	},


	/**
	**	Verifies the maximum length of the field.
	*/
	maxlen: function (model, ctval, name, value)
	{
		if (value.toString().length > ctval)
			throw new Error (ctval);

		return value;
	},


	/**
	**	Verifies the minimum value of the field.
	*/
	minval: function (model, ctval, name, value)
	{
		if (parseFloat(value) < ctval)
			throw new Error (ctval);

		return value;
	},


	/**
	**	Verifies the maximum value of the field.
	*/
	maxval: function (model, ctval, name, value)
	{
		if (parseFloat(value) > ctval)
			throw new Error (ctval);

		return value;
	},


	/**
	**	Verifies the minimum number of items in the array.
	*/
	mincount: function (model, ctval, name, value)
	{
		if (Rin.typeOf(value) != "array" || value.length < ctval)
			throw new Error (ctval);

		return value;
	},


	/**
	**	Verifies the maximum number of items in the array.
	*/
	maxcount: function (model, ctval, name, value)
	{
		if (Rin.typeOf(value) != "array" || value.length > ctval)
			throw new Error (ctval);

		return value;
	},


	/**
	**	Verifies the format of the field using a regular expression. The constraint value should be the name of
	**	one of the Model.Regex regular expressions.
	*/
	pattern: function (model, ctval, name, value)
	{
		if (!Regex[ctval].test (value.toString()))
			throw new Error (ctval);

		return value;
	},


	/**
	**	Verifies that the field is inside the specified set of options. The set can be an array or a string with
	**	the options separated by vertical bar (|). The comparison is case-sensitive.
	*/
	inset: function (model, ctval, name, value)
	{
		if (Rin.typeOf(ctval) != "array")
		{
			if (!new RegExp("^("+ctval.toString()+")$").test (value.toString()))
				throw new Error (ctval);

			return value;
		}

		if (ctval.indexOf(value.toString()) == -1)
			throw new Error (ctval.join("|"));

		return value;
	},


	/**
	**	Sets the field to upper case.
	*/
	upper: function (model, ctval, name, value)
	{
		return ctval ? value.toString().toUpperCase() : value;
	},


	/**
	**	Sets the field to lower case.
	*/
	lower: function (model, ctval, name, value)
	{
		return ctval ? value.toString().toLowerCase() : value;
	}
};

},{"./alpha":7,"./model-regex":16}],15:[function(require,module,exports){
/*
**	rin/model-list
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let Rin = require('./alpha');
let Model = require('./model');

/**
**	Generic list for models.
*/

module.exports = Model.extend
({
	/**
	**	Name of the class.
	*/
	className: "List",

	/**
	**	Class of the items in the list, can be overriden by child classes to impose a more strict constraint.
	*/
	itemt: Model,

	/**
	**	Mirror of properties.contents
	*/
	contents: null,

	/**
	**	Default properties of the model.
	*/
	defaults:
	{
		contents: null
	},

	/**
	**	Constraints of the model to ensure integrity.
	*/
	constraints:
	{
		contents: {
			type: "array",
			arrayof: "@itemt"
		}
	},

	/**
	**	Initialization epilogue. Called after initialization and after model properties are set.
	**
	**	>> void ready ();
	*/
	ready: function ()
	{
		this._eventGroup = "ModelList_" + Date.now() + ":modelChanged";

		this.contents = this.data.contents;
	},

	/**
	**	Connects the event handlers to the item.
	**
	**	>> Model _bind (int index, Model item);
	*/
	_bind: function (index, item)
	{
		if (item && item.addEventListener) item.addEventListener (this._eventGroup, this._onItemEvent, this, index);
		return item;
	},

	/**
	**	Disconnects the event handlers from the item.
	**
	**	>> Model _unbind (Model item);
	*/
	_unbind: function (item)
	{
		if (item && item.removeEventListener) item.removeEventListener (this._eventGroup);
		return item;
	},

	/**
	**	Handler for item events.
	**
	**	>> Model _onItemEvent (Event evt, object args, object data);
	*/
	_onItemEvent: function (evt, args, data)
	{
		this.prepareEvent ("itemChanged", { index: data, item: evt.source }).from (evt)
		.enqueue (this.prepareEvent ("modelChanged", { fields: ["contents"] })).resume ();
	},

	/**
	**	Returns the number of items in the list.
	**
	**	>> int count ();
	*/
	count: function ()
	{
		return this.data.contents.length;
	},

	/**
	**	Clears the contents of the list.
	**
	**	>> void clear ();
	*/
	clear: function ()
	{
		for (var i = 0; i < this.data.contents; i++)
			this._unbind (this.data.contents[i]);

		this.data.contents = [];

		this.prepareEvent ("itemCleared")
		.enqueue (this.prepareEvent ("modelChanged", { fields: ["contents"] })).resume ();
	},

	/**
	**	Sets the contents of the list with the specified array. All items will be ensured to be of the same model
	**	type as the one specified in the list.
	**
	**	>> void setData (array data);
	*/
	setData: function (data)
	{
		this.clear ();
		if (!data) return;

		for (var i = 0; i < data.length; i++)
		{
			var item = Rin.ensureTypeOf(this.itemt, data[i]);
			this._bind (i, item);

			this.data.contents.push (item);
		}

		this.prepareEvent ("itemsChanged")
		.enqueue (this.prepareEvent ("modelChanged", { fields: ["contents"] })).resume ();
	},

	/**
	**	Returns the raw array contents of the list.
	**
	**	>> array getData ();
	*/
	getData: function ()
	{
		return this.data.contents;
	},

	/**
	**	Returns the item at the specified index or null if the index is out of bounds.
	**
	**	>> Model getAt (int index);
	*/
	getAt: function (index)
	{
		if (index < 0 || index >= this.data.contents.length)
			return null;

		return Rin.ensureTypeOf(this.itemt, this.data.contents[index]);
	},

	/**
	**	Removes and returns the item at the specified index. Returns null if the index is out of bounds.
	**
	**	>> Model removeAt (int index);
	*/
	removeAt: function (index)
	{
		if (index < 0 || index >= this.data.contents.length)
			return null;

		var item = Rin.ensureTypeOf(this.itemt, this.data.contents.splice(index, 1)[0]);
		this._unbind (item);

		this.prepareEvent ("itemRemoved", { index: index, item: item })
		.enqueue (this.prepareEvent ("modelChanged", { fields: ["contents"] })).resume ();

		return item;
	},

	/**
	**	Sets the item at the specified index. Returns false if the index is out of bounds, true otherwise. The
	**	item will be ensured to be of the model defined in the list.
	**
	**	>> bool setAt (int index, Model item);
	*/
	setAt: function (index, item)
	{
		if (index < 0 || index >= this.data.contents.length)
			return false;

		item = Rin.ensureTypeOf(this.itemt, item);

		this.data.contents[index] = item;
		this._bind (index, item);

		this.prepareEvent ("itemChanged", { index: index, item: item })
		.enqueue (this.prepareEvent ("modelChanged", { fields: ["contents"] })).resume ();

		return true;
	},

	/**
	**	Notifies a change in the item at the specified index. Returns false if the index is out of bounds.
	**
	**	>> bool updateAt (int index);
	*/
	updateAt: function (index)
	{
		if (index < 0 || index >= this.data.contents.length)
			return false;

		this.prepareEvent ("itemChanged", { index: index, item: this.data.contents[index] })
		.enqueue (this.prepareEvent ("modelChanged", { fields: ["contents"] })).resume ();

		return true;
	},

	/**
	**	Adds an item to the bottom of the list. Returns null if the item is not an object or a model. The item
	**	will be ensured to be of the model specified in the list.
	**
	**	>> Model push (Model item);
	*/
	push: function (item)
	{
		if (item && Rin.typeOf(item) != "object")
			return null;

		item = Rin.ensureTypeOf(this.itemt, item);

		this.data.contents.push (item);
		this._bind (this.data.contents.length-1, item);

		this.prepareEvent ("itemAdded", { index: this.data.contents.length-1, item: item })
		.enqueue (this.prepareEvent ("modelChanged", { fields: ["contents"] })).resume ();

		return item;
	},

	/**
	**	Removes and returns an item from the bottom of the list.
	**
	**	>> Model pop ();
	*/
	pop: function ()
	{
		return this._unbind (Rin.ensureTypeOf(this.itemt, this.data.contents.pop()));
	},

	/**
	**	Adds an item to the top of the list. Returns null if the item is not an object or a model. The item
	**	will be ensured to be of the model specified in the list.
	**
	**	>> Model unshift (Model item);
	*/
	unshift: function (item)
	{
		if (item && Rin.typeOf(item) != "object")
			return null;

		item = Rin.ensureTypeOf(this.itemt, item);

		this.data.contents.unshift (item);
		this._bind (0, item);

		this.prepareEvent ("itemAdded", { index: 0, item: item })
		.enqueue (this.prepareEvent ("modelChanged", { fields: ["contents"] })).resume ();

		return item;
	},

	/**
	**	Removes and returns an item from the top of the list.
	**
	**	>> Model shift ();
	*/
	shift: function ()
	{
		return this._unbind (Rin.ensureTypeOf(this.itemt, this.data.contents.shift()));
	},

	/**
	**	Searches for an item matching the specified partial definition and returns its index. Returns -1 if the
	**	item was not found. If retObject is set to true the object will be returned instead of its index and null
	**	will be returned when the item is not found.
	**
	**	int|object find (object data, bool retObject=false);
	*/
	find: function (data, retObject)
	{
		var contents = this.data.contents;

		for (var i = 0; i < contents.length; i++)
		{
			if (Rin.partialCompare (contents[i].data, data))
				return retObject ? contents[i] : i;
		}

		return retObject ? null : -1;
	}
});

},{"./alpha":7,"./model":17}],16:[function(require,module,exports){
/*
**	rin/model-regex
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
**	Common regular expressions for pattern validation.
*/

module.exports =
{
	email: /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)+$/i,
	url: /^[\w-]+:\/\/[\w-]+(\.\w+)+.*$/,
	urlNoProt: /^[\w-]+(\.\w+)+.*$/,
	name: /^[-A-Za-z0-9_.]+$/,
	uname: /^['\pL\pN ]+$/,
	text: /^[^&<>{}]*$/,
	utext: /^([\r\n\pL\pN\pS &!@#$%*\[\]()_+=;',.\/?:"~-]+)$/
};

},{}],17:[function(require,module,exports){
/*
**	rin/model
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let Rin = require('./alpha');
let EventDispatcher = require('./event-dispatcher');

/**
**	A model is a high-integrity data object used to store properties and more importantly to provide event support to notify of any
**	kind of change that occurs to the model's properties. Integrity of the model is maintained by optionally using property constraints.
*/

let _Model = module.exports = EventDispatcher.extend
({
	/**
	**	Name of the class.
	*/
	className: "Model",

	/**
	**	Default properties for the model. Can be a map with the property name and its default value or a function
	**	returning a map with dynamic default values. This is used to reset the model to its initial state.
	*/
	defaults: null,

	/**
	**	Model property contraints. A map with the property name and an object specifying the constraints of the
	**	property. This is used to determine the type, format and behavior of each property in the model.
	*/
	constraints: null,

	/**
	**	Properties of the model.
	*/
	data: null,

	/**
	**	Array with the name of the properties that have changed. Populated prior modelChanged event.
	*/
	changedList: null,

	/**
	**	Silent mode indicator. While in silent mode events will not be dispatched.
	*/
	_silent: 0,

	/**
	**	Current nesting level of the set() method. This is used to determine when all the property
	**	changes are done.
	*/
	_level: 0,

	/**
	**	Initializes the model and sets the properties to the specified data object.
	**
	**	>> Model __ctor (object data);
	**	>> Model __ctor (object data, object defaults);
	*/
	__ctor: function (data, defaults)
	{
		this._super.EventDispatcher.__ctor();

		this.data = { };

		if (defaults != null)
		{
			this.reset (defaults);
		}
		else
		{
			var o = null;

			if (!this.defaults && this.constraints)
			{
				var o = { };

				for (var i in this.constraints)
				{
					var j = this.constraints[i];
					if (j.def === null || j.def === undefined)
					{
						o[i] = null;
						continue;
					}

					if (typeof(j.def) == "function")
						o[i] = j.def();
					else
						o[i] = j.def;
				}
			}

			this.reset(o);
		}

		this.init();

		if (data != null)
			this.set (arguments[0], true);

		if (this.constraints) this.update();

		this.ready();
	},

	/**
	**	Resets the model to its default state and triggers update events. If a map is provided the defaults of
	**	the model will be set to the specified map.
	**
	**	>> Model reset (object defaults, [bool nsilent=true]);
	**	>> Model reset ([bool nsilent=true]);
	*/
	reset: function (defaults, nsilent)
	{
		if (!this.defaults)
		{
			if (!defaults || (Rin.typeOf(defaults) != "object" && Rin.typeOf(defaults) != "function"))
				return this;

			this.defaults = defaults;
		}

		if (Rin.typeOf(this.defaults) == "function")
			this.data = this.defaults();
		else
			this.data = Rin.clone(this.defaults);

		return (nsilent === false || defaults === false) ? this : this.update(null, true);
	},

	/**
	**	Initializes the model. Called before the model properties are set.
	**
	**	>> void init ();
	*/
	init: function ()
	{
	},

	/**
	**	Initialization epilogue. Called after initialization and after model properties are set.
	**
	**	>> void ready ();
	*/
	ready: function ()
	{
	},

	/**
	**	Enables or disables silent mode. When the model is in silent mode events will not be dispatched.
	**
	**	>> Model silent (value: bool);
	*/
	silent: function (value)
	{
		this._silent += value ? 1 : -1;
		return this;
	},

	/**
	**	Validates a property name and value against the constraints defined in the model (if any). Returns the
	**	final value if successful or throws an empty exception if errors occur.
	**
	**	>> T _validate (string name, T value);
	*/
	_validate: function (name, value)
	{
		if (!this.constraints || !this.constraints[name])
			return value;

		var constraints = this.constraints[name];

		var nvalue = value;

		for (var ctname in constraints)
		{
			if (!_Model.Constraints[ctname])
				continue;

			try {
				nvalue = _Model.Constraints[ctname] (this, constraints[ctname], name, nvalue);
			}
			catch (e)
			{
				if (e.message == "null")
					break;

				throw new Error (`Constraint [${ctname}:${constraints[ctname]}] failed on property '${name}'.`);
			}
		}

		return nvalue;
	},

	/**
	**	Sets the value of a property and returns the value set. This method is internally used to set properties
	**	one at a time. If constraints are present in the model for the specified property all constraints will be
	**	verified. When constraint errors occur the constraintError event will be raised and the property value
	**	will not be changed.
	**
	**	>> T _set (string name, T value);
	*/
	_set: function (name, value)
	{
		if (!this.constraints || !this.constraints[name])
		{
			this.data[name] = value;
			return value;
		}

		var constraints = this.constraints[name];

		var cvalue = this.data[name];
		var nvalue = value;

		for (var ctname in constraints)
		{
			if (!_Model.Constraints[ctname])
				continue;

			try {
				nvalue = _Model.Constraints[ctname] (this, constraints[ctname], name, nvalue);
			}
			catch (e)
			{
				if (e.message == "null")
					break;

				if (!this._silent)
					this.dispatchEvent ("constraintError", { constraint: ctname, message: e.message, name: name, value: value });

				break;
			}
		}

		return (this.data[name] = nvalue);
	},

	/**
	**	Triggers property events to indicate a property is changing. First triggers "propertyChanging" and then
	**	"propertyChanged". If the first event returns false the second event will not be triggered.
	**
	**	>> void _propertyEvent (string name, T prev, T value, bool direct=false);
	*/
	_propertyEvent: function (name, prev, value, direct)
	{
		var temp = { name: name, old: prev, value: value, level: this._level };

		var evt = this.dispatchEvent ("propertyChanging", temp);

		if (!direct)
			temp.value = this._set (name, temp.value);
		else
			this.data[name] = temp.value;

		if (evt != null && evt.ret.length && evt.ret[0] === false)
			return;

		this.dispatchEvent ("propertyChanged." + name, temp);
		this.dispatchEvent ("propertyChanged", temp);

		this.changedList.push (name);
	},

	/**
	**	Sets one or more properties of the model. Possible arguments can be two strings or a map.
	**
	**	>> Model set (string name, T value, bool force=true);
	**	>> Model set (string name, T value, bool silent=false);
	**	>> Model set (string name, T value);
	**	>> Model set (object data);
	*/
	set: function ()
	{
		var n = arguments.length;
		var force = false, silent = false;

		if ((n > 2 || (n == 2 && Rin.typeOf(arguments[0]) == "object")) && Rin.typeOf(arguments[n-1]) == "boolean")
		{
			force = arguments[--n];
			if (force === false) silent = true;
		}

		if (this._level == 0)
		{
			this.changedList = [];
		}

		this._level++;

		if (n == 2)
		{
			if (this.data[arguments[0]] != arguments[1] || force)
			{
				if (!this._silent && !silent)
					this._propertyEvent (arguments[0], this.data[arguments[0]], this._validate (arguments[0], arguments[1]));
				else
					this._set (arguments[0], arguments[1]);
			}
		}
		else
		{
			for (var i in arguments[0])
			{
				if (this.data[i] != arguments[0][i] || force)
				{
					if (!this._silent && !silent)
						this._propertyEvent (i, this.data[i], this._validate (i, arguments[0][i]));
					else
						this._set (i, arguments[0][i]);
				}
			}
		}

		if (!--this._level && this.changedList.length && !silent && !this._silent)
			this.dispatchEvent ("modelChanged", { fields: this.changedList });

		return this;
	},

	/**
	**	Returns the value of a property. If no name is specified the whole map of properties will be returned.
	**	If a boolean value of "true" is provided the properties map will be returned but first will be compacted
	**	using the default data to ensure only valid properties are present.
	**
	**	>> T get (string name);
	**	>> object get ();
	**	>> object get (true);
	**	>> object get (false);
	**	
	*/
	get: function (name, def)
	{
		if (arguments.length == 0 || name === false)
			return this.data;

		if (arguments.length == 1 && name === true)
			return this.flatten ();

		if (arguments.length == 2)
			return this.data[name] === undefined ? def : this.data[name];

		return this.data[name];
	},

	/**
	**	Returns the value of a property as an integer number.
	**
	**	>> int getInt (string name, [int def]);
	*/
	getInt: function (name, def)
	{
		if (arguments.length == 2)
			return this.data[name] === undefined ? def : parseInt (this.data[name]);

		return parseInt (this.data[name]);
	},

	/**
	**	Returns the value of a property as a floating point number.
	**
	**	>> float getFloat (string name, [float def]);
	*/
	getFloat: function (name, def)
	{
		if (arguments.length == 2)
			return this.data[name] === undefined ? def : parseFloat (this.data[name]);

		return parseFloat (this.data[name]);
	},

	/**
	**	Returns the value of a property as a boolean value (true or false).
	**
	**	>> bool getBool (string name, [bool def]);
	**	
	*/
	getBool: function (name, def)
	{
		if (arguments.length == 2)
			name = this.data[name] === undefined ? def : this.data[name];
		else
			name = this.data[name];

		if (name === "true" || name === true)
			return true;

		if (name === "false" || name === false)
			return false;

		return parseInt (name) ? true : false;
	},

	/**
	**	Returns a reference object for a model property. The resulting object contains two methods
	**	named "get" and "set" to modify the value of the property.
	**
	**	>> object getReference (string name);
	*/
	getReference: function (name)
	{	
		var m = this;

		return {
			get: function() {
				return m.get(name);
			},

			set: function(value) {
				m.set(name, value);
			}
		};
	},

	/**
	**	Sets or returns a constraint given the property name. 
	**
	**	>> Model constraint (string field, string constraint, T value);
	**	>> Model constraint (string field, object constraint);
	**	>> Model constraint (object constraints);
	**	>> object constraint (string field);
	*/
	constraint: function (field, constraint, value)
	{
		if (arguments.length == 3 || arguments.length == 2 || (arguments.length == 1 && Rin.typeOf(field) == "object"))
		{
			if (this.constraints === this.constructor.prototype.constraints)
				this.constraints = Rin.clone (this.constraints);

			switch (arguments.length)
			{
				case 1:
					Rin.override (this.constraints, field);
					break;

				case 2:
					Rin.override (this.constraints[field], constraint);
					break;

				case 3:
					this.constraints[field][constraint] = value;
					break;
			}

			return this;
		}

		return !field ? this : this.constraints[field];
	},

	/**
	**	Returns a compact version of the model properties. That is, a map only with validated properties that are
	**	also present in the default data map. Returns null if the object is not compliant. If the "safe" parameter
	**	is set one last property named "class" will be attached, this specifies the original classPath of the object.
	**
	**	>> object flatten ([bool safe=false]);
	*/
	flatten: function (safe, rsafe)
	{
		if (safe)
		{
			var data = this.flatten(false, true);
			if (data == null) return null;

			data["class"] = this.classPath;
			return data;
		}

		if (!this.constraints && !this.defaults)
			return this.data;

		if (!this.isCompliant())
			return { };

		var constraints = this.constraints;
		var keys = this.defaults ? (Rin.typeOf(this.defaults) == "function" ? this.defaults() : this.defaults) : this.constraints;

		var data = { };

		for (var i in this.data)
		{
			if (!(i in keys)) continue;

			if (constraints && constraints[i])
			{
				var ct = constraints[i];

				if (ct.model)
				{
					data[i] = this.data[i] ? this.data[i].flatten(rsafe) : null;
					continue;
				}

				if (ct.arrayof)
				{
					data[i] = [];

					for (var j = 0; j < this.data[i].length; j++)
						data[i][j] = this.data[i][j] ? this.data[i][j].flatten(rsafe) : null;

					continue;
				}

				if (ct.cls)
				{
					data[i] = this.data[i] ? this.data[i].flatten() : null;
					continue;
				}
			}

			data[i] = this.data[i];
		}

		return data;
	},

	/**
	**	Removes a property or a list of properties.
	**
	**	>> void remove (string name, [bool nsilent=true]);
	**	>> void remove (array name, [bool nsilent=true]);
	*/
	remove: function (name, nsilent)
	{
		if (Rin.typeOf(name) == "array")
		{
			for (var i = 0; i < name.length; i++)
				delete this.data[name[i]];

			if (nsilent !== false && !this._silent)
				this.dispatchEvent ("propertyRemoved", { fields: name });
		}
		else
		{
			delete this.data[name];

			if (nsilent !== false && !this._silent)
				this.dispatchEvent ("propertyRemoved", { fields: [name] });
		}
	},

	/**
	**	Triggers data change events for one or more properties. Ensure that silent mode is not enabled or else
	**	this method will have no effect. If no parameters are provided a full update will be triggered on all of
	**	the model properties.
	**
	**	>> Model update (array fields);
	**	>> Model update (string name);
	**	>> Model update ();
	*/
	update: function (fields, direct)
	{
		if (this._silent) return this;

		if (this._level == 0)
		{
			this.changedList = [];
		}

		this._level++;

		if (fields && Rin.typeOf(fields) == "string")
		{
			this._propertyEvent (fields, this.data[fields], this.data[fields], direct);
		}
		else
		{
			if (fields)
			{
				for (var i of fields)
					this._propertyEvent (i, this.data[i], this.data[i], direct);
			}
			else
			{
				for (var i in this.data)
					this._propertyEvent (i, this.data[i], this.data[i], direct);
			}
		}

		if (!--this._level && this.changedList.length && !this._silent)
			this.dispatchEvent ("modelChanged", { fields: this.changedList });

		return this;
	},

	/**
	**	Validates one or mode model properties using the defined constraints. If no parameters are provided all of
	**	the properties in the model will be validated.
	**
	**	>> Model validate (array fields);
	**	>> Model validate (string name);
	**	>> Model validate ();
	*/
	validate: function (fields)
	{
		if (!this.constraints) return this;

		if (fields && Rin.typeOf(fields) == "string")
		{
			this._set (fields, this.data[fields])
		}
		else
		{
			for (var i in this.data)
			{
				if (fields && Rin.indexOf(fields, i) == -1)
					continue;

				this._set (i, this.data[i])
			}
		}

		return this;
	},

	/**
	**	Validates all the properties in the model and returns a boolean indicating if all of them comply with the
	**	constraints defined in the model.
	**
	**	>> bool isCompliant ();
	*/
	isCompliant: function ()
	{
		if (!this.constraints) return true;

		try
		{
			for (var i in this.data)
				this._validate (i, this.data[i]);

			return true;
		}
		catch (e) {
		}

		return false;
	},

	/**
	**	Registers an event handler for changes in a specific property of the model.
	**
	**	>> void observe (string property, function handler, object context);
	*/
	observe: function (property, handler, context)
	{
		this.addEventListener ("propertyChanged." + property, handler, context);
	},

	/**
	**	Unregisters an event handler from changes in a specific property of the model.
	**
	**	>> void unobserve (string property, function handler, object context);
	*/
	unobserve: function (property, handler, context)
	{
		this.removeEventListener ("propertyChanged." + property, handler, context);
	},

	/**
	**	Serializes the model into a string.
	**
	**	string toString ();
	*/
	toString: function ()
	{
		return Rin.serialize(this.get (true));
	}
});


/**
**	Import model constraints.
*/

_Model.Constraints = require('./model-constraints');

},{"./alpha":7,"./event-dispatcher":10,"./model-constraints":14}],18:[function(require,module,exports){
/*
**	rin/schema
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let Rin = require('./alpha');

/**
**	The utility functions in this module allow to create a very strict serialization/deserialization schema
**	to ensure that all values are of the specific type when stored in string format.
*/

let Schema = module.exports =
{
	Type: function (proto)
    {
		let tmp =
		{
            flatten: function (value, context) {
                return value;
            },

            unflatten: function (value, context) {
                return value;
            }
        };

        return proto ? Rin.override(tmp, proto) : tmp;
    },

	String: function()
	{
		return Schema.Type
		({
			flatten: function (value, context) {
				return value != null ? value.toString() : null;
			},

			unflatten: function (value, context) {
				return value != null ? value.toString() : null;
			}
		});
	},

	Integer: function()
	{
		return Schema.Type
		({
			flatten: function (value, context) {
				return ~~value;
			},

			unflatten: function (value, context) {
				return ~~value;
			}
		});
	},

	Number: function (precision)
	{
		return Schema.Type
		({
			_precision: precision,
			_round: false,

			precision: function (value)
			{
				this._precision = ~~value;
				return this;
			},

			flatten: function (value, context)
			{
				value = parseFloat(value);

				if (this._precision > 0)
					value = (~~(value*Math.pow(10, this._precision))) / Math.pow(10, this._precision);

				return value;
			},

			unflatten: function (value, context) {
				return parseFloat(value);
			}
		});
	},

	Bool: function (compact)
	{
		return Schema.Type
		({
			_compact: compact,

			compact: function(value)
			{
				this._compact = value;
				return this;
			},

			flatten: function (value, context) {
				value = ~~value;
				return this._compact ? (value > 0 ? 1 : 0) : (value > 0 ? true : false);
			},

			unflatten: function (value, context) {
				return (~~value) ? true : false;
			}
		});
	},

	SharedString: function()
	{
		return Schema.Type
		({
			flatten: function (value, context)
			{
				if (value == null) return 0;

				value = value.toString();

                if (!("strings" in context))
                {
                    context.strings_map = { };
                    context.strings = [ ];
                }

                if (!(value in context.strings_map))
                {
                    context.strings.push(value);
                    context.strings_map[value] = context.strings.length;
                }

                return context.strings_map[value];
            },

			unflatten: function (value, context)
			{
                return value == null || value == 0 ? null : context.strings[~~value - 1];
            }
        });
    },

	Array: function (type)
    {
        return Schema.Type({

			itemType: type,
			_debug: false,

			debug: function(v) {
				this._debug = v;
				return this;
			},

            of: function (type) {
                this.itemType = type;
                return this;
            },

			flatten: function (value, context)
			{
				if (value == null) return null;

                let o = [ ];
                
                for (let i = 0; i < value.length; i++)
                    o.push(this.itemType.flatten(value[i], context));

                return o;
            },

			unflatten: async function (value, context)
			{
				if (value == null) return null;

                let o = [ ];

				for (let i = 0; i < value.length; i++)
				{
					o.push(await this.itemType.unflatten(value[i], context));
				}

                return o;
            }
        });
    },

    Object: function()
    {
        return Schema.Type({

            properties: [ ],

            property: function (name, type)
            {
                this.properties.push({ name: name, type: type });
                return this;
            },

            flatten: function (value, context)
            {
				if (value == null) return null;

				let o;

				if (context.symbolic === true)
				{
					o = { };

					for (let i = 0; i < this.properties.length; i++)
					{
						o[this.properties[i].name] = this.properties[i].type.flatten(value[this.properties[i].name], context);
					}
				}
				else
				{
					o = [ ];

					for (let i = 0; i < this.properties.length; i++)
					{
						o.push(this.properties[i].type.flatten(value[this.properties[i].name], context));
					}
				}

                return o;
            },
            
            unflatten: async function (value, context)
            {
				if (value == null) return null;

				let o = { };

				if (context.symbolic === true)
				{
					for (let i = 0; i < this.properties.length; i++)
					{
						o[this.properties[i].name] = await this.properties[i].type.unflatten(value[this.properties[i].name], context);
					}
				}
				else
				{
				
					for (let i = 0; i < this.properties.length; i++)
					{
						o[this.properties[i].name] = await this.properties[i].type.unflatten(value[i], context);
					}
				}

                return o;
            }
        });
	},

    Class: function (classConstructor)
    {
		return Schema.Type
		({
            _constructor: classConstructor,

            constructor: function (classConstructor)
            {
                this._constructor = classConstructor;
                return this;
            },

            flatten: function (value, context)
            {
                return value == null ? null : value.flatten(context);
            },

            unflatten: async function (value, context)
            {
				return value == null ? null : await (new this._constructor()).unflatten(value, context);
            }
        });
	},

	/*
	**	Used when you want to specify just a single property.
	*/
    Property: function(name, type)
    {
        return Schema.Type({

			property: name,
			type: type,

			name: function (name)
			{
				this.property = name;
				return this;
			},

			is: function (type)
			{
				this.type = type;
				return this;
			},

            flatten: function (value, context)
            {
				if (value == null) return null;

				let o;

				if (context.symbolic === true)
				{
					o = { };
					o[this.property] = this.type.flatten(value[this.property], context);
				}
				else
				{
					o = this.type.flatten(value[this.property], context);
				}

                return o;
            },

            unflatten: async function (value, context)
            {
				if (value == null) return null;

				let o = { };

				if (context.symbolic === true)
					o[this.property] = await this.type.unflatten(value[this.property], context);
				else
					o[this.property] = await this.type.unflatten(value, context);

                return o;
            }
        });
	},

    Map: function()
    {
        return Schema.Type({

            flatten: function (value, context)
            {
				if (value == null) return null;

				if (context.symbolic === true)
					return value;

				let o = [ ];

				for (let i in value)
				{
					o.push(i);
					o.push(value[i]);
				}

                return o;
            },

            unflatten: function (value, context)
            {
				if (value == null) return null;

				if (context.symbolic === true)
					return value;

				let o = { };

				for (let i = 0; i < value.length; i += 2)
					o[value[i]] = value[i+1];

                return o;
            }
        });
	}
};

},{"./alpha":7}],19:[function(require,module,exports){
/*
**	rin/template
**
**	Copyright (c) 2013-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
**	Templating module. The template formats available are shown below, note that the sym-open and sym-close symbols are by
**	default the square brackets, however those can be modified since are just parameters.
**
**	HTML Escaped Output:			[data.value]					Escapes HTML characters from the output.
**	Raw Output:						[!data.value]					Does not escape HTML characters from the output (used to output direct HTML).
**	Double-Quoted Escaped Output:	[$data.value]					Escapes HTML characters and surrounds with double quotes.
**	Immediate Reparse:				[<....] OR [@....]				Reparses the contents as if parseTemplate() was called again.
**	Immediate Output:				[:...]							Takes the contents and outputs exactly as-is without format and optionally surrounded by the
**																	sym-open and sym-close symbols when the first character is not '<', sym_open or space.
**	Filtered Output:				[filterName ... <expr> ...]		Runs a filter call, 'expr' can be any of the allowed formats shown here (nested if desired),
**																	filterName should map to one of the available filter functions in the Rin.Template.filters map,
**																	each of which have their own parameters.
*/

let Template = module.exports =
{
	/**
	**	Parses a template and returns the compiled 'parts' structure to be used by the 'expand' method.
	**
	**	>> array parseTemplate (string template, char sym_open, char sym_close, bool is_tpl=false);
	*/
	parseTemplate: function (template, sym_open, sym_close, is_tpl)
	{
		let nflush = 'string', flush = null, state = 0, count = 0;
		let str = '', nstr = '';
		let parts = [], mparts = parts, nparts = false;
	
		if (is_tpl === true)
		{
			template = template.trim();
			state = 2;
	
			mparts.push(parts = []);
		}
	
		template += "\0";
	
		for (let i = 0; i < template.length; i++)
		{
			switch (state)
			{
				case 0:
					if (template[i] == '\0')
					{
						flush = 'string';
					}
					else if (template[i] == sym_open && template[i+1] == '<')
					{
						state = count = 1;
						flush = 'string';
						nflush = 'parse-string-and-merge';
					}
					else if (template[i] == sym_open && template[i+1] == '@')
					{
						state = count = 1;
						flush = 'string';
						nflush = 'parse-string-and-merge';
						i++;
					}
					else if (template[i] == sym_open && template[i+1] == ':')
					{
						state = 4; count = 1;
						flush = 'string';
						nflush = 'string';
						i++;
					}
					else if (template[i] == sym_open)
					{
						state = count = 1;
						flush = 'string';
						nflush = 'parse-template';
					}
					else
					{
						str += template[i];
					}

					break;
	
				case 1:
					if (template[i] == '\0')
					{
						throw new Error ("Parse error: Unexpected end of template");
					}
	
					if (template[i] == sym_close)
					{
						count--;
	
						if (count < 0)
							throw new Error ("Parse error: Unmatched " + sym_close);

						if (count == 0)
						{
							state = 0;
							flush = nflush;
							break;
						}
					}
					else if (template[i] == sym_open)
					{
						count++;
					}
	
					str += template[i];
					break;
	
				case 2:
					if (template[i] == '\0')
					{
						flush = nflush;
						break;
					}
					else if (template[i] == '.')
					{
						flush = nflush;
						nflush = 'string';
						break;
					}
					else if (template[i].match(/[\t\n\r\f\v ]/) != null)
					{
						flush = nflush;
						nflush = 'string';
						nparts = true;
	
						while (template[i].match(/[\t\n\r\f\v ]/) != null) i++;
						i--;
	
						break;
					}
					else if (template[i] == sym_open && template[i+1] == '<')
					{
						if (str) flush = nflush;
						state = 3; count = 1; nflush = 'parse-string-and-merge';
						break;
					}
					else if (template[i] == sym_open && template[i+1] == '@')
					{
						if (str) flush = nflush;
						state = 3; count = 1; nflush = 'parse-string-and-merge';
						i++;
						break;
					}
					else if (template[i] == sym_open && template[i+1] == ':')
					{
						if (str) flush = nflush;
						state = 5; count = 1; nflush = 'string';
						i++;
						break;
					}
					else if (template[i] == sym_open)
					{
						if (str)
						{
							flush = nflush;
							nstr = template[i];
						}
	
						state = 3; count = 1; nflush = 'parse-string';
	
						if (str) break;
					}
	
					str += template[i];
					break;
	
				case 3:
					if (template[i] == '\0')
						throw new Error ("Parse error: Unexpected end of template");
	
					if (template[i] == sym_close)
					{
						count--;
	
						if (count < 0)
							throw new Error ("Parse error: Unmatched " + sym_close);

						if (count == 0)
						{
							state = 2;
	
							if (nflush == 'parse-string-and-merge')
								break;
						}
					}
					else if (template[i] == sym_open)
					{
						count++;
					}
	
					str += template[i];
					break;

				case 4:
					if (template[i] == '\0')
						throw new Error ("Parse error: Unexpected end of template");
	
					if (template[i] == sym_close)
					{
						count--;
	
						if (count < 0)
							throw new Error ("Parse error: Unmatched " + sym_close);

						if (count == 0)
						{
							if (str.length != 0)
							{
								if (!(str[0] == '<' || str[0] == '[' || str[0] == ' '))
									str = sym_open + str + sym_close;
							}

							state = 0;
							flush = nflush;
							break;
						}
					}
					else if (template[i] == sym_open)
					{
						count++;
					}
	
					str += template[i];
					break;

				case 5:
					if (template[i] == '\0')
						throw new Error ("Parse error: Unexpected end of template");

					if (template[i] == sym_close)
					{
						count--;
	
						if (count < 0)
							throw new Error ("Parse error: Unmatched " + sym_close);

						if (count == 0)
						{
							if (!(str[0] == '<' || str[0] == '[' || str[0] == ' '))
								str = sym_open + str + sym_close;

							state = 2;
							break;
						}
					}
					else if (template[i] == sym_open)
					{
						count++;
					}
	
					str += template[i];
					break;
			}
	
			if (flush != null)
			{
				if (flush == 'parse-template')
				{
					str = Template.parseTemplate (str, sym_open, sym_close, true);
				}
				else if (flush == 'parse-string')
				{
					str = Template.parseTemplate (str, sym_open, sym_close, false);
					str = str[0];
				}
				else if (flush == 'parse-string-and-merge')
				{
					str = Template.parseTemplate (str, sym_open, sym_close, false);
				}
	
				if (typeof(str) != 'string' || str.length != 0)
				{
					if (flush == 'parse-string-and-merge')
					{
						for (let i = 0; i < str.length; i++)
							parts.push(str[i]);
					}
					else
						parts.push(str);
				}
	
				if (nparts)
				{
					mparts.push(parts = []);
					nparts = false;
				}
	
				flush = null;
				str = nstr;
				nstr = '';
			}
		}
	
		return mparts;
	},

	/**
	**	Parses a template and returns the compiled 'parts' structure to be used by the 'expand' method. This
	**	version assumes the sym_open and sym_close chars are [ and ] respectively.
	**
	**	>> array parse (string template);
	*/
	parse: function (template)
	{
		return this.parseTemplate(template.trim(), '[', ']', false);
	},

	/**
	**	Expands a template using the given data object, mode can be set to 'text' or 'obj' allowing to expand the template as
	**	a string (text) or an array of objects (obj) respectively. If none provided it will be expanded as text.
	**
	**	>> string/array expand (array parts, object data, string mode='text');
	*/
	expand: function (parts, data, mode)
	{
		// Expand variable parts.
		if (mode == 'var')
		{
			parts = Template.expand(parts, data, 'obj');

			if (parts[0] == 'nl')
				return '\n';

			let escape = true;
			let quote = false;

			while (true)
			{
				if (parts[0][0] == '$')
				{
					parts[0] = parts[0].substr(1);
					quote = true;
				}
				else if (parts[0][0] == '!')
				{
					parts[0] = parts[0].substr(1);
					escape = false;
				}
				else
					break;
			}

			let i = 0;

			if (parts[i] == 'this')
				i++;

			for (; i < parts.length && data != null; i++)
			{
				if (parts[i] in data)
					data = data[parts[i]];
				else
					data = null;
			}

			if (typeof(data) == 'string')
			{
				if (escape)
					data = data.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

				if (quote)
					data = '"' + data + '"';
			}

			return data;
		}
	
		// Expand function parts.
		if (mode == 'fn')
		{
			var args = [];

			args.push(Template.expand(parts[0], data, 'arg'));

			if ('_'+args[0] in Template.filters)
				args[0] = '_'+args[0];

			if (!(args[0] in Template.filters))
				return `(Unknown: ${args[0]})`;

			if (args[0][0] == '_')
				return Template.filters[args[0]] (parts, data);

			for (let i = 1; i < parts.length; i++)
				args.push(Template.expand(parts[i], data, 'arg'));

			return Template.filters[args[0]] (args, parts, data);
		}
	
		// Expand template parts.
		if (mode == 'tpl')
		{
			if (parts.length == 1)
				return Template.expand(parts[0], data, 'var');
	
			return Template.expand(parts, data, 'fn');
		}
	
		// Expand string parts.
		let s = [];
	
		for (let i = 0; i < parts.length; i++)
		{
			if (typeof(parts[i]) != 'string')
				s.push(Template.expand(parts[i], data, 'tpl'));
			else
				s.push(parts[i]);
		}
	
		// Return as argument ('object' if only one, or string if more than one), that is, the first item in the result.
		if (mode == 'arg')
		{
			if (s.length != 1)
				return s.join('');

			return s[0];
		}
	
		if (mode != 'obj') /* AKA if (mode == 'text') */
		{
			let f = (e => e != null && typeof(e) == 'object' ? ('map' in e ? e.map(f).join('') : ('join' in e ? e.join('') : e.toString())) : e);
			s = s.map(f).join('');
		}
	
		return s;
	},

	/**
	**	Parses the given template and returns a function that when called with an object will expand the template.
	**
	**	>> object compile (string template);
	*/
	compile: function (template)
	{
		template = Template.parse(template);

		return function (data, mode) {
			return Template.expand(template, data, mode);
		};
	}
};


/**
**	Template filters, functions that are used to format data. Each function takes three parameters (args, parts and data). By default the filter arguments
**	are expanded and passed via 'args' for convenience, however if the filter name starts with '_' the 'args' parameter will be skipped and only (parts, data)
**	will be available, each 'part' must be expanded manually by calling Template.expand.
*/

Template.filters =
{
	/**
	**	Expression filters.
	*/
	'not': function(args) { return !args[1]; },
	'notnull': function(args) { return !!args[1]; },
	'null': function(args) { return !args[1]; },
	'int': function(args) { return ~~args[1]; },
	'eq': function(args) { return args[1] == args[2]; },
	'ne': function(args) { return args[1] != args[2]; },
	'lt': function(args) { return args[1] < args[2]; },
	'le': function(args) { return args[1] <= args[2]; },
	'gt': function(args) { return args[1] > args[2]; },
	'ge': function(args) { return args[1] >= args[2]; },
	'and': function(args) { for (let i = 1; i < args.length; i++) if (!args[i]) return false; return true; },
	'or': function(args) { for (let i = 1; i < args.length; i++) if (~~args[i]) return true; return false; },
	'char': function(args) { return String.fromCharCode(args[1]); },

	/**
	**	Returns the JSON representation of the expression.
	**
	**	json <expr>
	*/
	'json': function (args)
	{
		return JSON.stringify(args[1], null, 4);
	},

	/**
	**	Sets a variable in the data context.
	**
	**	set <var-name> <expr>
	*/
	'set': function (args, parts, data)
	{
		data[args[1]] = args[2];
		return '';
	},

	/**
	**	Returns the expression without white-space on the left or right. The expression can be a string or an array.
	**
	**	trim <expr>
	*/
	'trim': function (args)
	{
		return args[1] ? (typeof(args[1]) == "object" ? args[1].map(e => e.trim()) : args[1].trim()) : '';
	},

	/**
	**	Returns the expression in uppercase. The expression can be a string or an array.
	**
	**	upper <expr>
	*/
	'upper': function (args)
	{
		return args[1] ? (typeof(args[1]) == "object" ? args[1].map(e => e.toUpperCase()) : args[1].toUpperCase()) : '';
	},

	/**
	**	Returns the expression in lower. The expression can be a string or an array.
	**
	**	lower <expr>
	*/
	'lower': function (args)
	{
		return args[1] ? (typeof(args[1]) == "object" ? args[1].map(e => e.toLowerCase()) : args[1].toLowerCase()) : '';
	},

	/**
	**	Converts all new-line chars in the expression to <br/>, the expression can be a string or an array.
	**
	**	nl2br <expr>
	*/
	'nl2br': function (args)
	{
		return args[1] ? (typeof(args[1]) == "object" ? args[1].map(e => e.replace(/\n/g, "<br/>")) : args[1].replace(/\n/g, "<br/>")) : '';
	},

	/**
	**	Returns the expression inside an XML tag named 'tag-name', the expression can be a string or an array.
	**
	**	% <tag-name> <expr>
	*/
	'%': function (args)
	{
		args.shift();
		var name = args.shift();

		let s = '';

		for (let i = 0; i < args.length; i++)
		{
			if (typeof(args[i]) == 'object' && ('length' in args[i]))
			{
				for (let j = 0; j < args[i].length; j++)
					s += `<${name}>${args[i][j]}</${name}>`;
			}
			else
				s += `<${name}>${args[i]}</${name}>`;
		}

		return s;
	},

	/**
	**	Returns the expression inside an XML tag named 'tag-name', attributes are supported.
	**
	**	%% <tag-name> [<attr> <value>]* [<content>]
	*/
	'%%': function (args)
	{
		args.shift();
		var name = args.shift();

		let attr = '';
		let text = '';

		for (let i = 0; i < args.length; i += 2)
		{
			if (i+1 < args.length)
				attr += ` ${args[i]}="${args[i+1]}"`;
			else
				text = args[i];
		}

		return text ? `<${name}${attr}>${text}</${name}>` : `<${name}${attr}/>`;
	},

	/**
	**	Joins the given array expression into a string. The provided string-expr will be used as separator.
	**
	**	join <string-expr> <array-expr>
	*/
	'join': function (args)
	{
		if (args[2] && typeof(args[2]) == "object" && "join" in args[2])
			return args[2].join(args[1]);

		return '';
	},

	/**
	**	Splits the given expression by the specified string. Returns an array.
	**
	**	split <string-expr> <expr>
	*/
	'split': function (args)
	{
		if (args[2] && typeof(args[2]) == "string")
			return args[2].split(args[1]);

		return [];
	},

	/**
	**	Returns an array with the keys of the given object-expr.
	**
	**	keys <object-expr>
	*/
	'keys': function (args)
	{
		if (args[1] && typeof(args[1]) == "object")
			return Object.keys(args[1]);

		return [];
	},

	/**
	**	Returns an array with the values of the given object-expr.
	**
	**	values <object-expr>
	*/
	'values': function (args)
	{
		if (args[1] && typeof(args[1]) == "object")
			return Object.values(args[1]);

		return [];
	},

	/**
	**	Constructs an array obtained by expanding the given template for each of the items in the list-expr, the optional varname
	**	parameter (defaults to 'i') indicates the name of the variable that will contain the data of each item as the list-expr is
	**	traversed. The default variables i# and i## (suffix '#' and '##') are introduced to denote the index/key and numeric index
	**	of the current item respectively, note that the later will always have a numeric value.
	**
	**	each <list-expr> [<varname:i>] <template>
	*/
	'_each': function (parts, data)
	{
		let var_name = 'i';
		let list = Template.expand(parts[1], data, 'arg');

		let k = 2;

		try {
			let tmp = Template.expand(parts[k], data, 'arg');

			if (tmp && tmp.match(/^[A-Za-z0-9_-]+$/) != null) {
				var_name = tmp;
				k++;
			}
		}
		catch(e) {
		}

		let s = [];
		let j = 0;

		for (let i in list)
		{
			data[var_name] = list[i];
			data[var_name + '##'] = j++;
			data[var_name + '#'] = i;

			for (let j = k; j < parts.length; j++)
				s.push(Template.expand(parts[j], data, 'text'));
		}

		delete data[var_name];
		delete data[var_name + '#'];

		return s;
	},

	/**
	**	Returns the valueA if the expression is true otherwise valueB, this is a short version of the 'if' filter with the
	**	difference that the result is 'obj' instead of text.
	**
	**	? <expr> <valueA> [<valueB>]
	*/
	'_?': function (parts, data)
	{
		if (Template.expand(parts[1], data, 'arg'))
			return Template.expand(parts[2], data, 'arg');

		if (parts.length > 3)
			return Template.expand(parts[3], data, 'arg');

		return '';
	},

	/**
	**	Returns the value if the expression is true, supports 'elif' and 'else' as well. The result of this filter is always text.
	**
	**	if <expr> <value> [elif <expr> <value>] [else <value>]
	*/
	'_if': function (parts, data)
	{
		for (let i = 0; i < parts.length; i += 3)
		{
			if (Template.expand(parts[i], data, 'arg') == 'else')
				return Template.expand(parts[i+1], data, 'text');

			if (Template.expand(parts[i+1], data, 'arg'))
				return Template.expand(parts[i+2], data, 'text');
		}

		return '';
	},

	/**
	**	Loads the expression value and attempts to match one case.
	**
	**	switch <expr> <case1> <value1> ... <caseN> <valueN> default <defvalue> 
	*/
	'_switch': function (parts, data)
	{
		let value = Template.expand(parts[1], data, 'arg');

		for (let i = 2; i < parts.length; i += 2)
		{
			let case_value = Template.expand(parts[i], data, 'arg');
			if (case_value == value || case_value == 'default')
				return Template.expand(parts[i+1], data, 'text');
		}

		return '';
	},

	/**
	**	Repeats the specified template for a number of times.
	**
	**	repeat [<from>] <count> [<varname:i>] <template>
	*/
	'repeat': function (args, parts, data)
	{
		let var_name = 'i';
		let count = ~~args[1];
		let from = 0;

		let k = 2;

		if (args[k] && args[k].match(/^[0-9]+$/) != null)
		{
			from = count;
			count = from + ~~args[k++];
		}

		if (args[k] && args[k].match(/^[A-Za-z0-9_-]+$/) != null)
			var_name = args[k++];

		let s = [];

		for (let i = from; i < count; i++)
		{
			data[var_name] = i;

			for (let j = k; j < parts.length; j++)
				s.push(Template.expand(parts[j], data, 'text'));
		}

		delete data[var_name];

		return s;
	},

	/**
	**	Loads the contents of the expression (map or array) in the global data map, fields/indices in the map/array will
	**	therefore be directly accessible afterwards.
	**
	**	load <expr>
	*/
	'_load': function (parts, data)
	{
		let obj = Template.expand(parts[1], data, 'arg');

		if (typeof(obj) != 'object')
			return '';

		for (let i in obj)
			data[i] = obj[i];

		return '';
	}
};

},{}],20:[function(require,module,exports){
(function (global){
/*! http://mths.be/base64 v0.1.0 by @mathias | MIT license */
;(function(root) {

	// Detect free variables `exports`.
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`.
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code, and use
	// it as `root`.
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var InvalidCharacterError = function(message) {
		this.message = message;
	};
	InvalidCharacterError.prototype = new Error;
	InvalidCharacterError.prototype.name = 'InvalidCharacterError';

	var error = function(message) {
		// Note: the error messages used throughout this file match those used by
		// the native `atob`/`btoa` implementation in Chromium.
		throw new InvalidCharacterError(message);
	};

	var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	// http://whatwg.org/html/common-microsyntaxes.html#space-character
	var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;

	// `decode` is designed to be fully compatible with `atob` as described in the
	// HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
	// The optimized base64-decoding algorithm used is based on @atk’s excellent
	// implementation. https://gist.github.com/atk/1020396
	var decode = function(input) {
		input = String(input)
			.replace(REGEX_SPACE_CHARACTERS, '');
		var length = input.length;
		if (length % 4 == 0) {
			input = input.replace(/==?$/, '');
			length = input.length;
		}
		if (
			length % 4 == 1 ||
			// http://whatwg.org/C#alphanumeric-ascii-characters
			/[^+a-zA-Z0-9/]/.test(input)
		) {
			error(
				'Invalid character: the string to be decoded is not correctly encoded.'
			);
		}
		var bitCounter = 0;
		var bitStorage;
		var buffer;
		var output = '';
		var position = -1;
		while (++position < length) {
			buffer = TABLE.indexOf(input.charAt(position));
			bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
			// Unless this is the first of a group of 4 characters…
			if (bitCounter++ % 4) {
				// …convert the first 8 bits to a single ASCII character.
				output += String.fromCharCode(
					0xFF & bitStorage >> (-2 * bitCounter & 6)
				);
			}
		}
		return output;
	};

	// `encode` is designed to be fully compatible with `btoa` as described in the
	// HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
	var encode = function(input) {
		input = String(input);
		if (/[^\0-\xFF]/.test(input)) {
			// Note: no need to special-case astral symbols here, as surrogates are
			// matched, and the input is supposed to only contain ASCII anyway.
			error(
				'The string to be encoded contains characters outside of the ' +
				'Latin1 range.'
			);
		}
		var padding = input.length % 3;
		var output = '';
		var position = -1;
		var a;
		var b;
		var c;
		var d;
		var buffer;
		// Make sure any padding is handled outside of the loop.
		var length = input.length - padding;

		while (++position < length) {
			// Read three bytes, i.e. 24 bits.
			a = input.charCodeAt(position) << 16;
			b = input.charCodeAt(++position) << 8;
			c = input.charCodeAt(++position);
			buffer = a + b + c;
			// Turn the 24 bits into four chunks of 6 bits each, and append the
			// matching character for each of them to the output.
			output += (
				TABLE.charAt(buffer >> 18 & 0x3F) +
				TABLE.charAt(buffer >> 12 & 0x3F) +
				TABLE.charAt(buffer >> 6 & 0x3F) +
				TABLE.charAt(buffer & 0x3F)
			);
		}

		if (padding == 2) {
			a = input.charCodeAt(position) << 8;
			b = input.charCodeAt(++position);
			buffer = a + b;
			output += (
				TABLE.charAt(buffer >> 10) +
				TABLE.charAt((buffer >> 4) & 0x3F) +
				TABLE.charAt((buffer << 2) & 0x3F) +
				'='
			);
		} else if (padding == 1) {
			buffer = input.charCodeAt(position);
			output += (
				TABLE.charAt(buffer >> 2) +
				TABLE.charAt((buffer << 4) & 0x3F) +
				'=='
			);
		}

		return output;
	};

	var base64 = {
		'encode': encode,
		'decode': decode,
		'version': '0.1.0'
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return base64;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = base64;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in base64) {
				base64.hasOwnProperty(key) && (freeExports[key] = base64[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.base64 = base64;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],21:[function(require,module,exports){
(function (global){
"use strict";

// ref: https://github.com/tc39/proposal-global
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof global !== 'undefined') { return global; }
	throw new Error('unable to locate global object');
}

var global = getGlobal();

module.exports = exports = global.fetch;

// Needed for TypeScript and Webpack.
exports.default = global.fetch.bind(global);

exports.Headers = global.Headers;
exports.Request = global.Request;
exports.Response = global.Response;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],22:[function(require,module,exports){
/*
**	xui/elems/xui-context
**
**	Copyright (c) 2019-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const xui = require('../xui');

/*
**	Context menu.
*/

xui.register ('xui-context',
{
	isRoot: true,

	events: {
		"click [data-action]": function(evt) {
			let action = evt.source.dataset.action;
			evt.source = this._source;
			this.root[action] (evt);
		}
	},

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
			this._source = evt.source;

			let hdl = () => {
				this.classList.remove('visible');
				window.removeEventListener('mouseup', hdl, true);
			};

			window.addEventListener('mouseup', hdl, true);

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

},{"../xui":29}],23:[function(require,module,exports){
/*
**	xui/elems/xui-dialog
**
**	Copyright (c) 2019-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const xui = require('../xui');

/*
**	Dialog.
*/

xui.register ('xui-dialog', 'xui-element',
{
	init: function()
	{
		this.classList.add('xui-dialog');

		if (this.classList.contains('x-draggable'))
			xui.draggable.attach(this.querySelector('.header'), this, 'xui-dialog');
	},

	show: function(imm)
	{
		if (this.classList.contains('visible'))
			return false;

		this.classList.remove('imm', 'hidden');
		this.classList.add('visible');

		if (imm === true) this.classList.add('imm');

		if ('front' in this) this.front();
		return true;
	},

	hide: function(imm)
	{
		if (this.classList.contains('hidden'))
			return false;

		this.classList.remove('imm', 'visible');
		this.classList.add('hidden');

		if (imm === true) this.classList.add('imm');
		return true;
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

},{"../xui":29}],24:[function(require,module,exports){
/*
**	xui/elems/xui-element
**
**	Copyright (c) 2019-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const xui = require('../xui');

/*
**	Base Element.
*/

xui.register ('xui-element',
{
	isRoot: true,

	events: {
		"click [data-action]": function(evt) {
			this[evt.source.dataset.action] (evt);
		},

		"keyup(13) input[data-enter]": function(evt) {
			this[evt.source.dataset.enter] (evt);
		}
	},

	init: function()
	{
		if (this.dataset['isRoot'] == 'false')
			this.isRoot = false;
	}
});

},{"../xui":29}],25:[function(require,module,exports){
/*
**	xui/elems/xui-list
**
**	Copyright (c) 2019-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const xui = require('../xui');

/*
**	Options List
*/

xui.register ('xui-list', 'xui-element',
{
	events: {
		"click span[data-value]": function(evt) {
			this.setValue (evt.source.dataset.value);
		}
	},

	ready: function()
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

		if (this.__observer == null)
		{
			this.__observer = new MutationObserver (() =>
			{
				if (this.children.length == 0 || this.children[0].tagName != 'SPAN')
					return;

				const h = this.getHeight(this.children[0]);
				if (h == this.itemHeight) return;

				this.itemHeight = h;
				this.style.height = (this.dataset.rows*this.itemHeight + this.baseHeight) + 'px';
			});
		}

		this.__observer.observe (this, { childList: true });
	},

	onDisconnected: function()
	{
		if (!this.dataset.rows)
			return;

		this.__observer.disconnect();
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

},{"../xui":29}],26:[function(require,module,exports){
/*
**	xui/elems/xui-tabs
**
**	Copyright (c) 2019-2020, RedStar Technologies, All rights reserved.
**	https://www.rsthn.com/
**
**	THIS LIBRARY IS PROVIDED BY REDSTAR TECHNOLOGIES "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
**	INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A 
**	PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL REDSTAR TECHNOLOGIES BE LIABLE FOR ANY
**	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
**	NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
**	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
**	STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
**	USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const xui = require('../xui');

/*
**	Tabs.
*/

xui.register ('xui-tabs',
{
	events:
	{
		'click [data-name]': function (evt) {
			this.selectTab (evt.source.dataset.name);
		}
	},

	init: function()
	{
		this.classList.add('xui-tabs');
	},

	/**
	**	Executed when the children of the element are ready.
	*/
	ready: function()
	{
		if ('container' in this.dataset)
			this.container = document.querySelector(this.dataset.container);
		else
			this.container = this.nextElementSibling;

		if ('default' in this.dataset)
			this._hideTabsExcept(this.dataset.default);
		else
			this._hideTabsExcept(null);
	},

	/**
	**	Hides all tabs except the one with the specified exceptName, if none specified then all tabs will be hidden (display: none), additionally
	**	the respective link item in the tab definition will have class 'active'.
	*/
	_hideTabsExcept: function (exceptName)
	{
		if (this.container == null) return;

		if (!exceptName) exceptName = '';

		for (let i = 0; i < this.container.children.length; i++)
		{
			if (this.container.children[i].dataset.name == exceptName)
			{
				if (this.container.children[i].style.display == 'none')
					this.dispatch('tab-activate', { el: this.container.children[i] });

				this.container.children[i].style.display = 'block';
			}
			else
			{
				if (this.container.children[i].style.display == 'block')
					this.dispatch('tab-deactivate', { el: this.container.children[i] });

				this.container.children[i].style.display = 'none';
			}
		}

		let links = this.querySelectorAll("[data-name]");

		for (let i = 0; i < links.length; i++)
		{
			if (links[i].dataset.name == exceptName)
				links[i].classList.add('active');
			else
				links[i].classList.remove('active');
		}
	},

	/**
	**	Shows the tab with the specified name.
	*/
	_showTab: function (name)
	{
		return this._hideTabsExcept (name);
	},

	/**
	**	Selects a tab given its name.
	*/
	selectTab: function (name)
	{
		this._showTab (name);
	}
});

},{"../xui":29}],27:[function(require,module,exports){

globalThis.xui = require('./main');

},{"./main":28}],28:[function(require,module,exports){

require('./elems/xui-element.js');
require('./elems/xui-dialog.js');
require('./elems/xui-list.js');
require('./elems/xui-context.js');
require('./elems/xui-tabs.js');

module.exports = require('./xui');

},{"./elems/xui-context.js":22,"./elems/xui-dialog.js":23,"./elems/xui-element.js":24,"./elems/xui-list.js":25,"./elems/xui-tabs.js":26,"./xui":29}],29:[function(require,module,exports){
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

},{"@rsthn/rin":13,"@rsthn/rin-front":5}]},{},[27]);
