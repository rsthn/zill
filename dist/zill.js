import{Template as t,Element as e}from"riza";
//!class zl
const i={elements:[],template:function(e){return t.compile(e)},register:function(t,...i){this.elements.push(t),e.register(t,...i)},alignValue:function(t,e){return Math.round(t/e)*e},overlapTest:function(t,e){var i=Math.max(t.left,e.left),s=Math.max(t.top,e.top),n=Math.min(t.right,e.right),a=Math.min(t.bottom,e.bottom);return Math.max(0,a-s)*Math.max(0,n-i)>0},position:{get:function(t){let e=t.getBoundingClientRect();return{x:e.left,y:e.top,width:e.width,height:e.height}},set:function(t,...e){if(1==e.length)return this.set(t,e[0].x,e[0].y);t.style.position="absolute",t.style.margin=0,t.style.transform="translateX(0) translateY(0)",t.style.left=e[0]+"px",t.style.top=e[1]+"px"}},
//!}
draggable:{initialized:!1,state:{enabled:!1,sx:0,sy:0,pos:null,target:null},group:{},attach:function(t,e,s){t&&e&&(s||(s="default"),this.initialized||(window.addEventListener("mousemove",this._mousemove.bind(this),!0),window.addEventListener("mouseup",this._mouseup.bind(this),!0),this.initialized=!0),s in this.group||(this.group[s]={max:800,list:[]}),e.style.zIndex=this.group[s].max++,this.group[s].list.push(e),e.front=()=>{e.style.zIndex=this.group[s].max;for(let t of this.group[s].list)t.style.zIndex--;"onFront"in e&&e.onFront()},t.onmousedown=t=>{this.state.sx=t.clientX,this.state.sy=t.clientY,this.state.target=e,this.state.pos=i.position.get(e),this.state.enabled=!0,e.front()})},_mousemove:function(t){if(!this.state.enabled)return;t.preventDefault(),t.stopPropagation();let e=t.clientX-this.state.sx,s=t.clientY-this.state.sy;i.position.set(this.state.target,this.state.pos.x+e,this.state.pos.y+s),"onDraggableMoved"in this.state.target&&this.state.target.onDraggableMoved(this.state.pos.x+e,this.state.pos.y+s)},_mouseup:function(t){this.state.enabled&&(this.state.enabled=!1,t.preventDefault(),t.stopPropagation())}},
//!}
scrollable:{attach:function(t){let e=!1,i=document.createElement("em");i.classList.add("vs-bar"),i.classList.add("pseudo");let s=document.createElement("em");i.appendChild(s);let n=document.createElement("em");s.appendChild(n),t.appendChild(i);const a=function(){let e=t.getBoundingClientRect().height;n.style.height=(100*e/t.scrollHeight).toFixed(2)+"%",i.style.top=t.scrollTop+"px",n.style.top=(100*t.scrollTop/t.scrollHeight).toFixed(2)+"%"};t._observer_scroll=new MutationObserver((function(){e||(e=!0,i.parentNode!=t&&(i.style.top="0px",n.style.height="0px",t.appendChild(i)),a(),e=!1)})),t._observer_scroll.observe(t,{childList:!0}),a(),t.onwheel=function(e){t.scrollTop+=15*e.deltaY,i.style.top=t.scrollTop+"px",n.style.top=(100*t.scrollTop/t.scrollHeight).toFixed(2)+"%"}}},
//!}
editable:{attach:function(t,e,i){if(null!=t.querySelector(".inline-input"))return;null===e&&(e=t.innerText.trim());let s=document.createElement("input");s.className="inline-input",s.type="text",s.value=e;let n=function(n){let a=i(n,e);!0!==a&&(!1!==a?(t.classList.remove("p-relative"),t.innerText=a):setTimeout((()=>{s.select(),s.focus()}),100))};s.onblur=()=>n(null),s.onkeydown=t=>{if(27!=t.keyCode&&13!=t.keyCode||(t.preventDefault(),t.stopPropagation()),27==t.keyCode)return s.onblur();13==t.keyCode&&n(s.value.trim())},t.classList.add("p-relative"),t.appendChild(s),s.select(),s.focus()}},
//!}
selectable:{initialized:!1,state:0,sx:0,sy:0,limit:null,rect:{left:0,top:0,right:0,bottom:0},div:null,attach:function(t){this.initialized||(this.div=document.createElement("div"),this.div.style.position="absolute",this.div.style.zIndex="99999",this.div.style.left="0px",this.div.style.top="0px",this.div.style.background="rgba(255,255,255,0.25)",this.div.style.border="1px solid rgba(0,0,0,0.5)",document.body.appendChild(this.div),window.addEventListener("mousemove",(t=>{this.state&&(t.preventDefault(),t.stopPropagation(),this.rect.left=Math.max(Math.min(this.sx,t.clientX),this.limit.left),this.rect.top=Math.max(Math.min(this.sy,t.clientY),this.limit.top),this.rect.right=Math.min(Math.max(this.sx,t.clientX),this.limit.right),this.rect.bottom=Math.min(Math.max(this.sy,t.clientY),this.limit.bottom),this.div.style.left=this.rect.left+"px",this.div.style.top=this.rect.top+"px",this.div.style.width=this.rect.right-this.rect.left+"px",this.div.style.height=this.rect.bottom-this.rect.top+"px")}),!0),window.addEventListener("mouseup",(t=>{if(!this.state)return;this.div.style.left="-1000px",this.div.style.top="-1000px",this.state=0;let e=[];for(let t of this.target.selection)t.classList.remove("selected");for(let t of this.target.children)i.overlapTest(this.rect,t.getBoundingClientRect())&&(t.classList.add("selected"),e.push(t));this.target.selection=e,"onSelectionChanged"in this.target&&this.target.onSelectionChanged(this.target.selection)})),this.initialized=!0),t.unselectable="on",t.style.userSelect="none",t.selection=[],t.addEventListener("mousedown",(e=>{1==e.which&&(this.limit=t.getBoundingClientRect(),this.target=t,this.state=1,this.sx=e.clientX,this.sy=e.clientY,this.rect.left=this.sx-1,this.rect.top=this.sy-1,this.rect.right=this.sx+1,this.rect.bottom=this.sy+1)}))}},
//!}
showDownload:function(t,e){var i=document.createElement("a");i.href=e,i.style.display="none",i.download=t,i.target="_blank",document.body.appendChild(i),i.click(),document.body.removeChild(i)},showFilePicker:function(t,e,i){var s=document.createElement("input");s.type="file",s.accept=e,s.style.display="none",s.multiple=t,document.body.appendChild(s),s.onchange=function(){i(s.files)},document.body.onfocus=function(){document.body.onfocus=null,document.body.removeChild(s)},s.click()},loadAsDataURL:function(t,e){var i=new FileReader;i.onload=function(t){e(t.target.result)},i.readAsDataURL(t)},loadAsText:function(t,e){var i=new FileReader;i.onload=function(t){e(t.target.result)},i.readAsText(t)},loadAsArrayBuffer:function(t,e){var i=new FileReader;i.onload=function(t){e(t.target.result)},i.readAsArrayBuffer(t)},loadAllAsDataURL:function(t,e){var s=[];if(t&&t.length){var n=function(a){a!=t.length?i.loadAsDataURL(t[a],(function(e){s.push({name:t[a].name,size:t[a].size,url:e}),n(a+1)})):e(s)};n(0)}else e(s)}};var s=i;s.register("zl-element",{init:function(){}}),s.register("zl-dialog","zl-element",{ready:function(){this.classList.add("zl-dialog"),this.classList.contains("x-draggable")&&s.draggable.attach(this.querySelector(".header"),this,"zl-dialog")},isVisible:function(){return this.classList.contains("visible")},show:function(t=!1){return!this.classList.contains("visible")&&(this.classList.remove("imm","hidden"),this.classList.add("visible"),!0===t&&this.classList.add("imm"),"front"in this&&this.front(),!0)},hide:function(t=!1){return!this.classList.contains("hidden")&&(this.classList.remove("imm","visible"),this.classList.add("hidden"),!0===t&&this.classList.add("imm"),!0)},maximize:function(){this.classList.add("maximized")},restore:function(){this.classList.remove("maximized")}}),s.register("zl-list","zl-element",{"event click span[data-value]":function(t){this.setValue(t.source.dataset.value)},ready:function(){this.classList.add("zl-list"),this.type="field",this.dataset.rows&&(this.style.height="0px",this.baseHeight=this.getHeight())},onConnected:function(){this.dataset.rows&&(null==this.__observer&&(this.__observer=new MutationObserver((()=>{if(0==this.children.length||"SPAN"!=this.children[0].tagName)return;const t=this.getHeight(this.children[0]);t!=this.itemHeight&&(this.itemHeight=t,this.style.height=this.dataset.rows*this.itemHeight+this.baseHeight+"px")}))),this.__observer.observe(this,{childList:!0}))},onDisconnected:function(){this.dataset.rows&&this.__observer.disconnect()},setValue:function(t){let e=this.querySelector('span[data-value="'+t+'"]');if(!e)return;let i=this.querySelector("span.selected");if(i){if(i.dataset.value==t)return;i.classList.remove("selected")}e.classList.add("selected"),this.onchange&&this.onchange()},getValue:function(){let t=this.querySelector("span.selected");return t?t.dataset.value:null}}),s.register("zl-context",{isRoot:!0,"event click [data-action]":function(t){t.params={elem:this._source,...t.params,...this._source.dataset},t.continuePropagation=!0},init:function(){this.classList.add("zl-dropdown"),this.classList.add("zl-context")},onConnected:function(){this.root=this.findRoot(),this._contextListener=this.root.listen("contextmenu",this.dataset.target,(t=>{this.classList.add("visible"),this._source=t.source;let e=()=>{this.classList.remove("visible"),window.removeEventListener("mouseup",e,!0)};window.addEventListener("mouseup",e,!0);let i=s.position.get(this.root);s.position.set(this,t.clientX-i.x,t.clientY-i.y)}))},onDisconnected:function(){this._contextListener.remove()},show:function(){this.classList.contains("visible")||(this.classList.remove("hidden"),this.classList.add("visible"))},hide:function(){this.classList.contains("hidden")||(this.classList.remove("visible"),this.classList.add("hidden"))}}),s.register("zl-tabs",{"event click [data-name]":function(t){this.selectTab(t.source.dataset.name)},ready:function(){this.classList.add("zl-tabs"),"container"in this.dataset?this.container=document.querySelector(this.dataset.container):this.container=this.nextElementSibling,"default"in this.dataset?this._hideTabsExcept(this.dataset.default):this._hideTabsExcept(null)},_hideTabsExcept:function(t){if(null==this.container)return;t||(t="");for(let e=0;e<this.container.children.length;e++)this.container.children[e].dataset.name==t?("none"==this.container.children[e].style.display&&this.dispatch("tab-activate",{el:this.container.children[e]}),this.container.children[e].style.display="block"):("block"==this.container.children[e].style.display&&this.dispatch("tab-deactivate",{el:this.container.children[e]}),this.container.children[e].style.display="none");let e=this.querySelectorAll("[data-name]");for(let i=0;i<e.length;i++)e[i].dataset.name==t?e[i].classList.add("active"):e[i].classList.remove("active")},_showTab:function(t){return this._hideTabsExcept(t)},selectTab:function(t){this._showTab(t)}});var n=s;export{n as default};
//# sourceMappingURL=zill.js.map