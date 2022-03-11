import {Template as $dnHZp$Template, Element as $dnHZp$Element} from "riza";


//!class zl
const $a2867869a02e809d$var$zl = {
    /**
	 * Registered elements with the `register` method.
	 * !static elements: Array<object>;
	 */ elements: [],
    /**
	 * Compiles a violet template and returns the evaluator function.
	 * @param {string} str - Template to compile.
	 * @returns {(data) => string}
	 * !static template(str);
	 */ template: function(str) {
        return $dnHZp$Template.compile(str);
    },
    /**
	 * Registers a new custom element with the specified name and prototypes.
	 * @param {string} name - Name of the element. Must be unique.
	 * @param  {...any} protos - Prototypes or super class names to add to the element.
	 * !static register (name, ...protos);
	 */ register: function(name, ...protos) {
        this.elements.push(name);
        $dnHZp$Element.register(name, ...protos);
    },
    /**
	 * Aligns the specified value such that it is a factor of the given step.
	 * @param {numbe} value - Value to align.
	 * @param {number} step - Step to align the value to.
	 * @returns {number}
	 * !static alignValue (value, step);
	 */ alignValue: function(value, step) {
        return Math.round(value / step) * step;
    },
    /**
	 * Returns `true` if the rectangles overlap.
	 * @param {DOMRect} rect1 - First rectangle.
	 * @param {DOMRect} rect2 - Second rectangle.
	 * @returns {boolean}
	 * !static overlapTes (rect1, rect2);
	 */ overlapTest: function(rect1, rect2) {
        var _x1 = Math.max(rect1.left, rect2.left);
        var _y1 = Math.max(rect1.top, rect2.top);
        var _x2 = Math.min(rect1.right, rect2.right);
        var _y2 = Math.min(rect1.bottom, rect2.bottom);
        return Math.max(0, _y2 - _y1) * Math.max(0, _x2 - _x1) > 0;
    },
    /**
	 * Utility methods related to element position.
	 * !static position = {
	 */ position: {
        /**
		 * Reads the position (and size) of the given element.
		 * @param {Element} elem - Source element.
		 * @returns { {x:number, y:number, width:number, height:number} }	
		 */ get: function(elem) {
            let p = elem.getBoundingClientRect();
            return {
                x: p.left,
                y: p.top,
                width: p.width,
                height: p.height
            };
        },
        /**
		 * Sets the position of the specified element.
		 * @param {Element} elem - Target element.
		 * @param {number} x - X position.
		 * @param {number} y - Y position.
		 * @returns {void}
		 */ /**
		 * Sets the position of the specified element.
		 * @param {Element} elem - Target element.
		 * @param { {x:number, y:number} } pos - Position of the element.
		 * @returns {void}
		 */ set: function(elem, ...args) {
            if (args.length == 1) return this.set(elem, args[0].x, args[0].y);
            elem.style.position = 'absolute';
            elem.style.margin = 0;
            elem.style.transform = 'translateX(0) translateY(0)';
            elem.style.left = args[0] + 'px';
            elem.style.top = args[1] + 'px';
        }
    },
    //!}
    /**
	 * Utility methods to add drag support to elements.
	 * !static draggable = {
	 */ draggable: {
        /**
		 * Indicates if the draggable module has been initialized.
		 */ initialized: false,
        /**
		 * Internal state.
		 */ state: {
            enabled: false,
            sx: 0,
            sy: 0,
            pos: null,
            target: null
        },
        /**
		 * Draggable elements grouped by their group name.
		 */ group: {
        },
        /**
		 * Attaches draggable support to the specified element.
		 * @param {Element} handle - Drag handle element.
		 * @param {Element} target - Target draggable element (container).
		 * @param {string} group? - Name of the draggable group.
		 * @returns {void}
		 * !static attach (handle, target, group);
		 */ attach: function(handle, target, group) {
            if (!handle || !target) return;
            if (!group) group = 'default';
            if (!this.initialized) {
                window.addEventListener('mousemove', this._mousemove.bind(this), true);
                window.addEventListener('mouseup', this._mouseup.bind(this), true);
                this.initialized = true;
            }
            if (!(group in this.group)) this.group[group] = {
                max: 800,
                list: []
            };
            target.style.zIndex = this.group[group].max++;
            this.group[group].list.push(target);
            target.front = ()=>{
                target.style.zIndex = this.group[group].max;
                for (let i of this.group[group].list)i.style.zIndex--;
                if ('onFront' in target) target.onFront();
            };
            handle.onmousedown = (evt)=>{
                this.state.sx = evt.clientX;
                this.state.sy = evt.clientY;
                this.state.target = target;
                this.state.pos = $a2867869a02e809d$var$zl.position.get(target);
                this.state.enabled = true;
                target.front();
            };
        },
        /**
		 * Global mouse move event handler.
		 */ _mousemove: function(evt) {
            if (!this.state.enabled) return;
            evt.preventDefault();
            evt.stopPropagation();
            let dx = evt.clientX - this.state.sx;
            let dy = evt.clientY - this.state.sy;
            $a2867869a02e809d$var$zl.position.set(this.state.target, this.state.pos.x + dx, this.state.pos.y + dy);
            if ('onDraggableMoved' in this.state.target) this.state.target.onDraggableMoved(this.state.pos.x + dx, this.state.pos.y + dy);
        },
        /**
		 * Global mouse up event handler.
		 */ _mouseup: function(evt) {
            if (this.state.enabled) {
                this.state.enabled = false;
                evt.preventDefault();
                evt.stopPropagation();
            }
        }
    },
    //!}
    /**
	 * Utility methods to add scroll support to elements.
	 * !static scrollable = {
	 */ scrollable: {
        /**
		 * Attaches scroll support to the specified element.
		 * @param {Element} target - Element to attach the scroll support.
		 * @returns void
		 * !static attach (target);
		 */ attach: function(target) {
            let mutex = false;
            let bar = document.createElement('em');
            bar.classList.add('vs-bar');
            bar.classList.add('pseudo');
            let innerBar = document.createElement('em');
            bar.appendChild(innerBar);
            let innerMostBar = document.createElement('em');
            innerBar.appendChild(innerMostBar);
            target.appendChild(bar);
            const update = function() {
                let height = target.getBoundingClientRect().height;
                innerMostBar.style.height = (100 * height / target.scrollHeight).toFixed(2) + "%";
                bar.style.top = target.scrollTop + "px";
                innerMostBar.style.top = (100 * target.scrollTop / target.scrollHeight).toFixed(2) + "%";
            };
            target._observer_scroll = new MutationObserver(function() {
                if (mutex) return;
                mutex = true;
                if (bar.parentNode != target) {
                    bar.style.top = '0px';
                    innerMostBar.style.height = '0px';
                    target.appendChild(bar);
                }
                update();
                mutex = false;
            });
            target._observer_scroll.observe(target, {
                childList: true
            });
            update();
            target.onwheel = function(evt) {
                target.scrollTop += 15 * evt.deltaY;
                bar.style.top = target.scrollTop + "px";
                innerMostBar.style.top = (100 * target.scrollTop / target.scrollHeight).toFixed(2) + "%";
            };
        }
    },
    //!}
    /**
	 * Utility methods to add text editing support to elements.
	 * !static editable = {
	 */ editable: {
        /**
		 * Attaches an editable to the specified target. The callback(new_value, old_value) is called when an event on the input happens (blur, ENTER-key, ESC-key),
		 * and if the callback returns false editing will continue (and the input will be re-focused), if the callback returns true nothing will be done, and if
		 * any other value is returned, it will be used as the new text content of the target. A new_value of null is sent to the callback when ESC or onblur happens.
		 * 
		 * @param {Element} target - Element to add the edition support.
		 * @param {string} prev_value - Previous value prior to edition.
		 * @param {(curValue:string, prevValue:string) => boolean)} callback - Callback to validate the values.
		 * @returns {void}
		 * !static attach (target, prev_value, callback);
		 */ attach: function(target, prev_value, callback) {
            if (target.querySelector('.inline-input') != null) return;
            if (prev_value === null) prev_value = target.innerText.trim();
            let input = document.createElement('input');
            input.className = 'inline-input';
            input.type = 'text';
            input.value = prev_value;
            let fn = function(cur_value) {
                let new_value = callback(cur_value, prev_value);
                if (new_value === true) return;
                if (new_value !== false) {
                    target.classList.remove('p-relative');
                    target.innerText = new_value;
                } else setTimeout(()=>{
                    input.select();
                    input.focus();
                }, 100);
            };
            input.onblur = ()=>fn(null)
            ;
            input.onkeydown = (evt)=>{
                if (evt.keyCode == 27 || evt.keyCode == 13) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                if (evt.keyCode == 27) return input.onblur();
                if (evt.keyCode == 13) fn(input.value.trim());
            };
            target.classList.add('p-relative');
            target.appendChild(input);
            input.select();
            input.focus();
        }
    },
    //!}
    /**
	 * Utility methods to add selection support to elements.
	 * !static selectable = {
	 */ selectable: {
        initialized: false,
        state: 0,
        sx: 0,
        sy: 0,
        limit: null,
        rect: {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
        },
        div: null,
        /**
		 * Adds selection support to the specified element. Event `onSelectionChanged` will be triggered on the element whenever the selection changes.
		 * Attribute `selection` of the element will have the list of items selected.
		 * @param {Element} target - Element to add the selection support.
		 * !static attach (target);
		 */ attach: function(target) {
            if (!this.initialized) {
                this.div = document.createElement('div');
                this.div.style.position = 'absolute';
                this.div.style.zIndex = '99999';
                this.div.style.left = '0px';
                this.div.style.top = '0px';
                this.div.style.background = 'rgba(255,255,255,0.25)';
                this.div.style.border = '1px solid rgba(0,0,0,0.5)';
                document.body.appendChild(this.div);
                window.addEventListener('mousemove', (evt)=>{
                    if (!this.state) return;
                    evt.preventDefault();
                    evt.stopPropagation();
                    this.rect.left = Math.max(Math.min(this.sx, evt.clientX), this.limit.left);
                    this.rect.top = Math.max(Math.min(this.sy, evt.clientY), this.limit.top);
                    this.rect.right = Math.min(Math.max(this.sx, evt.clientX), this.limit.right);
                    this.rect.bottom = Math.min(Math.max(this.sy, evt.clientY), this.limit.bottom);
                    this.div.style.left = this.rect.left + 'px';
                    this.div.style.top = this.rect.top + 'px';
                    this.div.style.width = this.rect.right - this.rect.left + 'px';
                    this.div.style.height = this.rect.bottom - this.rect.top + 'px';
                }, true);
                window.addEventListener('mouseup', (evt)=>{
                    if (!this.state) return;
                    this.div.style.left = '-1000px';
                    this.div.style.top = '-1000px';
                    this.state = 0;
                    let list = [];
                    for (let i of this.target.selection)i.classList.remove('selected');
                    for (let i1 of this.target.children)if ($a2867869a02e809d$var$zl.overlapTest(this.rect, i1.getBoundingClientRect())) {
                        i1.classList.add('selected');
                        list.push(i1);
                    }
                    this.target.selection = list;
                    if ('onSelectionChanged' in this.target) this.target.onSelectionChanged(this.target.selection);
                });
                this.initialized = true;
            }
            target.unselectable = 'on';
            target.style.userSelect = 'none';
            target.selection = [];
            target.addEventListener('mousedown', (evt)=>{
                if (evt.which != 1) return;
                this.limit = target.getBoundingClientRect();
                this.target = target;
                this.state = 1;
                this.sx = evt.clientX;
                this.sy = evt.clientY;
                this.rect.left = this.sx - 1;
                this.rect.top = this.sy - 1;
                this.rect.right = this.sx + 1;
                this.rect.bottom = this.sy + 1;
            });
        }
    },
    //!}
    /**
	 * Forces the browser to show a download dialog.
	 * @param {string} filename - Filename to show in the download dialog.
	 * @param {string} dataUrl - Data URI to download.
	 * 
	 * !static showDownload (filename, dataUrl);
	 */ showDownload: function(filename, dataUrl) {
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
	 * Forces the browser to show a file selection dialog.
	 * @param {boolean} allowMultiple - Set to `true` to allow multiple selections.
	 * @param {string} accept - Accepted MIME types.
	 * @param {(Array<File>) => void} callback - Callback used to handle the selected files.
	 * 
	 * !static showFilePicker (allowMultiple, accept, callback);
	 */ showFilePicker: function(allowMultiple, accept, callback) {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.style.display = 'none';
        input.multiple = allowMultiple;
        document.body.appendChild(input);
        input.onchange = function() {
            callback(input.files);
        };
        document.body.onfocus = function() {
            document.body.onfocus = null;
            document.body.removeChild(input);
        };
        input.click();
    },
    /**
	 * Loads a file using FileReader and returns the result as a dataURL.
	 * @param {File} file - File to load.
	 * @param {(dataUrl:string) => void} callback
	 * 
	 * !loadAsDataURL (file, callback);
	 */ loadAsDataURL: function(file, callback) {
        var reader = new FileReader();
        reader.onload = function(e) {
            callback(e.target.result);
        };
        reader.readAsDataURL(file);
    },
    /**
	 * Loads a file using FileReader and returns the result as text.
	 * @param {File} file - File to load.
	 * @param {(text:string) => void)} callback
	 * 
	 * !static loadAsText (file, callback);
	 */ loadAsText: function(file, callback) {
        var reader = new FileReader();
        reader.onload = function(e) {
            callback(e.target.result);
        };
        reader.readAsText(file);
    },
    /**
	 * Loads a file using FileReader and returns the result as an array buffer.
	 * @param {File} file - File to load.
	 * @param {(value:ArrayBuffer) => void} callback 
	 * 
	 * !static loadAsArrayBuffer (file, callback);
	 */ loadAsArrayBuffer: function(file, callback) {
        var reader = new FileReader();
        reader.onload = function(e) {
            callback(e.target.result);
        };
        reader.readAsArrayBuffer(file);
    },
    /**
	 * Loads an array of File objects using FileReader and returns them as data URLs.
	 * @param {Array<File>} fileList - Files to load.
	 * @param {Array<string>} callback 
	 * @returns {void}
	 * 
	 * !static loadAllAsDataURL (fileList, callback);
	 */ loadAllAsDataURL: function(fileList, callback) {
        var result = [];
        if (!fileList || !fileList.length) {
            callback(result);
            return;
        }
        var loadNext = function(i) {
            if (i == fileList.length) {
                callback(result);
                return;
            }
            $a2867869a02e809d$var$zl.loadAsDataURL(fileList[i], function(url) {
                result.push({
                    name: fileList[i].name,
                    size: fileList[i].size,
                    url: url
                });
                loadNext(i + 1);
            });
        };
        loadNext(0);
    }
};
var $a2867869a02e809d$export$2e2bcd8739ae039 = $a2867869a02e809d$var$zl;


/**
 * Base element.
 */ $a2867869a02e809d$export$2e2bcd8739ae039.register('zl-element', {
    init: function() {
    }
});



/**
 * Floating dialog.
 */ $a2867869a02e809d$export$2e2bcd8739ae039.register('zl-dialog', 'zl-element', {
    ready: function() {
        this.classList.add('zl-dialog');
        if (this.classList.contains('x-draggable')) $a2867869a02e809d$export$2e2bcd8739ae039.draggable.attach(this.querySelector('.header'), this, 'zl-dialog');
    },
    show: function(imm = false) {
        if (this.classList.contains('visible')) return false;
        this.classList.remove('imm', 'hidden');
        this.classList.add('visible');
        if (imm === true) this.classList.add('imm');
        if ('front' in this) this.front();
        return true;
    },
    hide: function(imm = false) {
        if (this.classList.contains('hidden')) return false;
        this.classList.remove('imm', 'visible');
        this.classList.add('hidden');
        if (imm === true) this.classList.add('imm');
        return true;
    },
    maximize: function() {
        this.classList.add('maximized');
    },
    restore: function() {
        this.classList.remove('maximized');
    }
});



/**
 * Options List
 */ $a2867869a02e809d$export$2e2bcd8739ae039.register('zl-list', 'zl-element', {
    'event click span[data-value]': function(evt) {
        this.setValue(evt.source.dataset.value);
    },
    ready: function() {
        this.classList.add('zl-list');
        this.type = 'field';
        if (this.dataset.rows) {
            this.style.height = '0px';
            this.baseHeight = this.getHeight();
        }
    //if (this.classList.contains('x-scrollable'))
    //	zl.scrollable.attach(this);
    },
    onConnected: function() {
        if (!this.dataset.rows) return;
        if (this.__observer == null) this.__observer = new MutationObserver(()=>{
            if (this.children.length == 0 || this.children[0].tagName != 'SPAN') return;
            const h = this.getHeight(this.children[0]);
            if (h == this.itemHeight) return;
            this.itemHeight = h;
            this.style.height = this.dataset.rows * this.itemHeight + this.baseHeight + 'px';
        });
        this.__observer.observe(this, {
            childList: true
        });
    },
    onDisconnected: function() {
        if (!this.dataset.rows) return;
        this.__observer.disconnect();
    },
    setValue: function(value) {
        let selected = this.querySelector('span[data-value="' + value + '"]');
        if (!selected) return;
        let curr = this.querySelector('span.selected');
        if (curr) {
            if (curr.dataset.value == value) return;
            curr.classList.remove('selected');
        }
        selected.classList.add('selected');
        if (this.onchange) this.onchange();
    },
    getValue: function() {
        let selected = this.querySelector('span.selected');
        return selected ? selected.dataset.value : null;
    }
});



/**
 * Context menu.
 */ $a2867869a02e809d$export$2e2bcd8739ae039.register('zl-context', {
    isRoot: true,
    'event click [data-action]': function(evt) {
        evt.params = {
            elem: this._source,
            ...evt.params,
            ...this._source.dataset
        };
        evt.continuePropagation = true;
    },
    init: function() {
        this.classList.add('zl-dropdown');
        this.classList.add('zl-context');
    },
    onConnected: function() {
        this.root = this.findRoot();
        this._contextListener = this.root.listen('contextmenu', this.dataset.target, (evt)=>{
            this.classList.add('visible');
            this._source = evt.source;
            let hdl = ()=>{
                this.classList.remove('visible');
                window.removeEventListener('mouseup', hdl, true);
            };
            window.addEventListener('mouseup', hdl, true);
            let parent = $a2867869a02e809d$export$2e2bcd8739ae039.position.get(this.root);
            $a2867869a02e809d$export$2e2bcd8739ae039.position.set(this, evt.clientX - parent.x, evt.clientY - parent.y);
        });
    },
    onDisconnected: function() {
        this._contextListener.remove();
    },
    show: function() {
        if (this.classList.contains('visible')) return;
        this.classList.remove('hidden');
        this.classList.add('visible');
    },
    hide: function() {
        if (this.classList.contains('hidden')) return;
        this.classList.remove('visible');
        this.classList.add('hidden');
    }
});



/**
 * Content tabs.
 */ $a2867869a02e809d$export$2e2bcd8739ae039.register('zl-tabs', {
    'event click [data-name]': function(evt) {
        this.selectTab(evt.source.dataset.name);
    },
    ready: function() {
        this.classList.add('zl-tabs');
        if ('container' in this.dataset) this.container = document.querySelector(this.dataset.container);
        else this.container = this.nextElementSibling;
        if ('default' in this.dataset) this._hideTabsExcept(this.dataset.default);
        else this._hideTabsExcept(null);
    },
    /**
	**	Hides all tabs except the one with the specified exceptName, if none specified then all tabs will be hidden (display: none), additionally
	**	the respective link item in the tab definition will have class 'active'.
	*/ _hideTabsExcept: function(exceptName) {
        if (this.container == null) return;
        if (!exceptName) exceptName = '';
        for(let i = 0; i < this.container.children.length; i++)if (this.container.children[i].dataset.name == exceptName) {
            if (this.container.children[i].style.display == 'none') this.dispatch('tab-activate', {
                el: this.container.children[i]
            });
            this.container.children[i].style.display = 'block';
        } else {
            if (this.container.children[i].style.display == 'block') this.dispatch('tab-deactivate', {
                el: this.container.children[i]
            });
            this.container.children[i].style.display = 'none';
        }
        let links = this.querySelectorAll("[data-name]");
        for(let i1 = 0; i1 < links.length; i1++)if (links[i1].dataset.name == exceptName) links[i1].classList.add('active');
        else links[i1].classList.remove('active');
    },
    /**
	**	Shows the tab with the specified name.
	*/ _showTab: function(name) {
        return this._hideTabsExcept(name);
    },
    /**
	**	Selects a tab given its name.
	*/ selectTab: function(name) {
        this._showTab(name);
    }
});



var $2c5784c895810013$export$2e2bcd8739ae039 = $a2867869a02e809d$export$2e2bcd8739ae039;


export {$2c5784c895810013$export$2e2bcd8739ae039 as default};
//# sourceMappingURL=zill.js.map
