/*
**	xui/xui-list
**
**	Copyright (c) 2019-2021, RedStar Technologies, All rights reserved.
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

import xui from './xui';

/**
 * Options List
 */

xui.register ('xui-list', 'xui-element',
{
	'event click span[data-value]': function(evt)
	{
		this.setValue (evt.source.dataset.value);
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

		//if (this.classList.contains('x-scrollable'))
		//	xui.scrollable.attach(this);
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
