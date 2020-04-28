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
