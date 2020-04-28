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
