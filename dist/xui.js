(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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


/**
**	Traverses the given object attempting to find the index/key that does an identical match with the specified value,
**	if not found returns null, otherwise the index/key where the value was found.
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

	return null;
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
**	Verifies if the specified object is of class m, if not it will create a new instance.
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
**	Deserializes a string in JSON format and returns an object.
**
**	>> object deserialize (string s);
*/
Rin.deserialize = function (s)
{
	return JSON.parse(s);
};

},{}],2:[function(require,module,exports){
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
**	Contains the named constructors of each of the super classes.
*/
Class._super = { };


/**
**	Name of the class, if none specified the class will be considered "final" and will not be inheritable.
*/
Class.prototype.className = "Class";


/**
**	Instance constructor.
*/
Class.prototype.__ctor = function ()
{
};


/**
**	Instance initialization.
*/
Class.prototype.__init = function ()
{
};


/**
**	Returns true if the object is an instance of the specified class (verifies inheritance).
**
**	>> bool isInstanceOf (string className);
**	>> bool isInstanceOf (class classConstructor);
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
**	Extends the class with the specified prototype. The prototype can be a function (class constructor) or an object. Note that
**	the class will be modified (and returned) instead of creating a new class, must be called at the class-level (not instance level),
**	when a class is provided all fields starting with uppercase at the class-level (not prototype) will not be inherited.
**
**	>> class inherit (function classConstructor);
**	>> class inherit (object obj);
*/
Class.inherit = function (proto)
{
	var self = this._class;

	var _super = self._super;
	var _class = self._class;

	if (Rin.typeOf(proto) == "function")
	{
		for (let i in proto._class)
			if (!/^[A-Z]/.test(i)) self[i] = proto._class[i];

		Rin.override (self.prototype, proto._class.prototype);

		Rin.override (_super, proto._class._super);

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
	delete _class.prototype.classInit;

	for (let i = 0; i < protos.length; i++)
		_class.inherit (protos[i]);

	delete _class._super.Class;

	if ("classInit" in _class.prototype)
		_class.prototype.classInit();

	return _class;
};


/**
**	Creates a new class with the specified prototypes each of which can be a class constructor (function) or an object.
**
**	>> object extend (object... protos);
*/
Class.extend = function (...protos)
{
	return this._class.prototype._extend (this, protos);
};


/**
**	Creates a new instance by extending the class first with the specified prototype.
**
**	>> object create (object proto);
*/
Class.create = function (proto)
{
	return new (this.extend(proto)) ();
};

},{"./alpha":1}],3:[function(require,module,exports){
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

const Rin = require('./alpha');
const Model = require('./model');
const Template = require('./template');

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
	**	Indicates if the element is a root element, that is, the target element to attach elements having data-ref attribute.
	*/
	isRoot: false,

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
		if (this.events)
			this.bindEvents (this.events);

		this._list_watch = [];
		this._list_visible = [];
		this._list_property = [];

		this.init();

		Object.keys(this._super).reverse().forEach(i =>
		{
			if ('init' in this._super[i])
				this._super[i].init();
		});

		this.collectWatchers();
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
	**	Sets the model of the element and executes the modelChanged event handler.
	**
	**	>> Element setModel (Model model);
	*/
	setModel: function (model)
	{
		if (!model) return this;

		if (!(model instanceof this.modelt))
			model = new this.modelt (model);

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

		this.onModelPreChanged(null, { fields: Object.keys(this.model.properties) });
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

			var args = null;

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
						this.listen (name, selector, function (evt, args)
						{
							if (Rin.indexOf(args, evt.keyCode.toString()) != -1)
								return hdl (evt, args);
						});
						continue;
				}
			}

			this.listen (name, selector, hdl);
		}

		return this;
	},

	/**
	**	Listens for an event for elements matching the specified selector.
	**
	**	>> void listen (string eventName, string selector, function handler);
	**	>> void listen (string eventName, function handler);
	*/
	listen: function (eventName, selector, handler)
	{
		if (Rin.typeOf(selector) == "function")
		{
			handler = selector;
			selector = null;
		}

		this.addEventListener (eventName, (evt) =>
		{
			if (selector && selector != "*")
			{
				let elems = this.querySelectorAll(selector);

				evt.source = evt.target;

				while (evt.source !== this)
				{
					let i = Rin.indexOf(elems, evt.source);
					if (i !== null)
					{
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
				handler.call (this, evt, evt.detail);
			}

			evt.stopPropagation();
		});
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
		this.innerHTML = value;
		this.collectWatchers ();
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
		let list;

		list = this.querySelectorAll("[data-watch]");
		for (let i = 0; i < list.length; i++)
		{
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
			list[i].onchange = function()
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

			list[i].name = list[i].dataset.property;

			list[i].removeAttribute('data-property');
			this._list_property.push(list[i]);
		}

		this._list_watch = this._list_watch.filter(i => i.parentElement != null);
		this._list_visible = this._list_visible.filter(i => i.parentElement != null);
		this._list_property = this._list_property.filter(i => i.parentElement != null);

		if (this.model != null)
			this.model.update(true);
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
	**	Executed whem the element is attached to the DOM tree.
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

			findRoot()
			{
				let elem = this.parentElement;

				while (elem != null)
				{
					if ("isRoot" in elem && elem.isRoot)
						return elem;

					elem = elem.parentElement;
				}

				return null;
			}

			connectedCallback()
			{
				if (this.dataset.ref)
				{
					let root = this.findRoot();
					if (root) root[this.dataset.ref] = this;
				}

				if (this.invokeConstructor)
				{
					this.invokeConstructor = false;
					this.__ctor();
				}

				this.onConnected();
			}

			disconnectedCallback()
			{
				if (this.dataset.ref)
				{
					let root = this.findRoot();
					if (root) root[this.dataset.ref] = null;
				}

				this.onDisconnected();
			}
		};

		Rin.override (newElement.prototype, Element);

		const proto = { };
		const _super = { };

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

			Rin.override (newElement.prototype, protos[i]);
			Rin.override (proto, protos[i]);
		}

		newElement.prototype._super = _super;
		proto._super = _super;

		customElements.define (name, newElement);
		Element.protos[name] = proto;

		return newElement;
	}
};

},{"./alpha":1,"./model":8,"./template":9}],4:[function(require,module,exports){
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

},{"./class":2,"./event":5}],5:[function(require,module,exports){
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
					if (window[this.list[this.i].handler].call (null, this, this.args, this.list[this.i].data) === false)
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

},{"./alpha":1,"./class":2}],6:[function(require,module,exports){
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

},{"./alpha":1,"./model-regex":7}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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
	properties: null,

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
	**	>> Model __ctor (string map);
	*/
	__ctor: function ()
	{
		this._super.EventDispatcher.__ctor();

		this.properties = { };

		if (arguments.length >= 2 && arguments[1] != null)
		{
			this.reset(arguments[1]);
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

		if (arguments.length >= 1 && arguments[0] != null)
			this.set(arguments[0], true);

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
			if (!defaults || Rin.typeOf(defaults) != "object")
				return this;

			this.defaults = defaults;
		}

		if (Rin.typeOf(this.defaults) == "function")
			this.properties = this.defaults();
		else
			this.properties = Rin.clone(this.defaults);

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
			this.properties[name] = value;
			return value;
		}

		var constraints = this.constraints[name];

		var cvalue = this.properties[name];
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

		return (this.properties[name] = nvalue);
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
			this.properties[name] = temp.value;

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
			if (this.properties[arguments[0]] != arguments[1] || force)
			{
				if (!this._silent && !silent)
					this._propertyEvent (arguments[0], this.properties[arguments[0]], this._validate (arguments[0], arguments[1]));
				else
					this._set (arguments[0], arguments[1]);
			}
		}
		else
		{
			for (var i in arguments[0])
			{
				if (this.properties[i] != arguments[0][i] || force)
				{
					if (!this._silent && !silent)
						this._propertyEvent (i, this.properties[i], this._validate (i, arguments[0][i]));
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
			return this.properties;

		if (arguments.length == 1 && name === true)
			return this.flatten ();

		if (arguments.length == 2)
			return this.properties[name] === undefined ? def : this.properties[name];

		return this.properties[name];
	},

	/**
	**	Returns the value of a property as an integer number.
	**
	**	>> int getInt (string name, [int def]);
	*/
	getInt: function (name, def)
	{
		if (arguments.length == 2)
			return this.properties[name] === undefined ? def : parseInt (this.properties[name]);

		return parseInt (this.properties[name]);
	},

	/**
	**	Returns the value of a property as a floating point number.
	**
	**	>> float getFloat (string name, [float def]);
	*/
	getFloat: function (name, def)
	{
		if (arguments.length == 2)
			return this.properties[name] === undefined ? def : parseFloat (this.properties[name]);

		return parseFloat (this.properties[name]);
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
			name = this.properties[name] === undefined ? def : this.properties[name];
		else
			name = this.properties[name];

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
			return this.properties;

		if (!this.isCompliant())
			return { };

		var constraints = this.constraints;
		var keys = this.defaults ? (Rin.typeOf(this.defaults) == "function" ? this.defaults() : this.defaults) : this.constraints;

		var data = { };

		for (var i in this.properties)
		{
			if (!(i in keys)) continue;

			if (constraints && constraints[i])
			{
				var ct = constraints[i];

				if (ct.model)
				{
					data[i] = this.properties[i] ? this.properties[i].flatten(rsafe) : null;
					continue;
				}

				if (ct.arrayof)
				{
					data[i] = [];

					for (var j = 0; j < this.properties[i].length; j++)
						data[i][j] = this.properties[i][j] ? this.properties[i][j].flatten(rsafe) : null;

					continue;
				}

				if (ct.cls)
				{
					data[i] = this.properties[i] ? this.properties[i].flatten() : null;
					continue;
				}
			}

			data[i] = this.properties[i];
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
				delete this.properties[name[i]];

			if (nsilent !== false && !this._silent)
				this.dispatchEvent ("propertyRemoved", { fields: name });
		}
		else
		{
			delete this.properties[name];

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
			this._propertyEvent (fields, this.properties[fields], this.properties[fields], direct);
		}
		else
		{
			for (var i in this.properties)
			{
				if (fields && Rin.indexOf(fields, i) == -1)
					continue;

				this._propertyEvent (i, this.properties[i], this.properties[i], direct);
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
			this._set (fields, this.properties[fields])
		}
		else
		{
			for (var i in this.properties)
			{
				if (fields && Rin.indexOf(fields, i) == -1)
					continue;

				this._set (i, this.properties[i])
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
			for (var i in this.properties)
				this._validate (i, this.properties[i]);

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

},{"./alpha":1,"./event-dispatcher":4,"./model-constraints":6}],9:[function(require,module,exports){
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
	'int': function(args) { return ~~args[1]; },
	'eq': function(args) { return args[1] == args[2]; },
	'ne': function(args) { return args[1] != args[2]; },
	'lt': function(args) { return args[1] < args[2]; },
	'le': function(args) { return args[1] <= args[2]; },
	'gt': function(args) { return args[1] > args[2]; },
	'ge': function(args) { return args[1] >= args[2]; },
	'and': function(args) { for (let i = 1; i < args.length; i++) if (!args[i]) return false; return true; },
	'or': function(args) { for (let i = 1; i < args.length; i++) if (~~args[i]) return true; return false; },

	/**
	**	Returns the JSON representation of the expression.
	**
	**	json <expr>
	*/
	'json': function(args)
	{
		return JSON.stringify(args[1], null, 4);
	},

	/**
	**	Sets a variable in the data context.
	**
	**	set <var-name> <expr>
	*/
	'set': function(args, parts, data)
	{
		data[args[1]] = args[2];
		return '';
	},

	/**
	**	Returns the expression without white-space on the left or right. The expression can be a string or an array.
	**
	**	trim <expr>
	*/
	'trim': function(args)
	{
		return args[1] ? (typeof(args[1]) == "object" ? args[1].map(e => e.trim()) : args[1].trim()) : '';
	},

	/**
	**	Returns the expression in uppercase. The expression can be a string or an array.
	**
	**	upper <expr>
	*/
	'upper': function(args)
	{
		return args[1] ? (typeof(args[1]) == "object" ? args[1].map(e => e.toUpperCase()) : args[1].toUpperCase()) : '';
	},

	/**
	**	Returns the expression in lower. The expression can be a string or an array.
	**
	**	lower <expr>
	*/
	'lower': function(args)
	{
		return args[1] ? (typeof(args[1]) == "object" ? args[1].map(e => e.toLowerCase()) : args[1].toLowerCase()) : '';
	},

	/**
	**	Converts all new-line chars in the expression to <br/>, the expression can be a string or an array.
	**
	**	nl2br <expr>
	*/
	'nl2br': function(args)
	{
		return args[1] ? (typeof(args[1]) == "object" ? args[1].map(e => e.replace(/\n/g, "<br/>")) : args[1].replace(/\n/g, "<br/>")) : '';
	},

	/**
	**	Returns the expression inside an XML tag named 'tag-name', the expression can be a string or an array.
	**
	**	% <tag-name> <expr>
	*/
	'%': function(args)
	{
		args.shift();
		var name = args.shift();

		let s = '';

		for (let i = 0; i < args.length; i++)
		{
			if (typeof(args[i]) != 'string')
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
	**	Joins the given array expression into a string. The provided string-expr will be used as separator.
	**
	**	join <string-expr> <array-expr>
	*/
	'join': function(args)
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
	'split': function(args)
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
	'keys': function(args)
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
	'values': function(args)
	{
		if (args[1] && typeof(args[1]) == "object")
			return Object.values(args[1]);

		return [];
	},

	/**
	**	Constructs an array obtained by expanding the given template for each of the items in the list-expr, the optional varname
	**	parameter (defaults to 'i') indicates the name of the variable that will contain the data of each item as the list-expr is
	**	traversed, also the default variable i# (suffix '#') is introduced to denote the index/key of the current item.
	**
	**	each <list-expr> [<varname:i>] <template>
	*/
	'each': function(args, parts, data)
	{
		let var_name = 'i';
		let list = args[1];

		let k = 2;

		if (args[k] && args[k].match(/^[A-Za-z0-9_-]+$/) != null)
			var_name = args[k++];

		let s = [];

		for (let i in list)
		{
			data[var_name] = list[i];
			data[var_name + '#'] = i;

			for (let j = k; j < parts.length; j++)
				s.push(Template.expand(parts[j], data, 'obj'));
		}

		delete data[var_name];
		delete data[var_name + '#'];

		return s;
	},

	/**
	**	Returns the value if the expression is true, supports 'elif' and 'else' as well.
	**
	**	if <expr> <value> [elif <expr> <value>] [else <value>]
	*/
	'_if': function(parts, data)
	{
		for (let i = 0; i < parts.length; i += 3)
		{
			if (Template.expand(parts[i], data, 'arg') == 'else')
				return Template.expand(parts[i+1], data, 'arg');

			if (Template.expand(parts[i+1], data, 'arg'))
				return Template.expand(parts[i+2], data, 'arg');
		}

		return '';
	},

	/**
	**	Loads the expression value and attempts to match one case.
	**
	**	switch <expr> <case1> <value1> ... <caseN> <valueN> default <defvalue> 
	*/
	'_switch': function(parts, data)
	{
		let value = Template.expand(parts[1], data, 'arg');

		for (let i = 2; i < parts.length; i += 2)
		{
			let case_value = Template.expand(parts[i], data, 'arg');
			if (case_value == value || case_value == 'default')
				return Template.expand(parts[i+1], data, 'arg');
		}

		return '';
	},

	/**
	**	Repeats the specified template for a number of times.
	**
	**	repeat <count> [<varname:i>] <template>
	*/
	'repeat': function(args, parts, data)
	{
		let var_name = 'i';
		let count = ~~(args[1]);

		let k = 2;

		if (args[k] && args[k].match(/^[A-Za-z0-9_-]+$/) != null)
			var_name = args[k++];

		let s = [];

		for (let i = 0; i < count; i++)
		{
			data[var_name] = i;

			for (let j = k; j < parts.length; j++)
				s.push(Template.expand(parts[j], data, 'obj'));
		}

		delete data[var_name];

		return s;
	}
};

},{}],10:[function(require,module,exports){
const xui = require('../xui');

xui.register ('xui-dialog',
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

		if (this.classList.contains('x-draggable'))
			xui.draggable.attach(this.querySelector('.header'), this);
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

},{"../xui":13}],11:[function(require,module,exports){
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

		if (this.classList.contains('x-scrollable'))
		{
			xui.scrollable.attach(this);
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

},{"../xui":13}],12:[function(require,module,exports){

require('./elems/dialog.js');
require('./elems/list.js');

module.exports = require('./xui');

},{"./elems/dialog.js":10,"./elems/list.js":11,"./xui":13}],13:[function(require,module,exports){
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

},{"@rsthn/rin/element":3,"@rsthn/rin/template":9}]},{},[12]);
