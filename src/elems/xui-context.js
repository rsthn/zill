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
			let opts = evt.source.dataset.action.split(' ');

			evt.source = this._source;

			if (opts[0] in this.root)
				this.root[opts[0]] ({...evt.source.dataset, ...opts}, evt);
			else
				evt.continuePropagation = true;
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
