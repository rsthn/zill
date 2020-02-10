#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const [ , , ...args ] = process.argv;

// *************************************************************
function mkdir (path)
{
	if (!fs.existsSync(path)) fs.mkdirSync(path);
}

function cp (src, dst, overwrite=true)
{
	if (dst.endsWith('/'))
		dst += path.basename(src);

	if (!overwrite && fs.existsSync(dst))
		return;

	fs.copyFileSync(src, dst);
}

// *************************************************************
if (args.length == 0 || args[0] == '--help' || args[0] == '-h')
{
	console.log(`
Usage: xui <command>

\x1B[93minit\x1B[0m        Initializes the current folder with the XUI project structure.
`);

	return;
}

// *************************************************************
if (args[0] == 'init')
{
	const src = __dirname+'/dist';

	mkdir('./dist');
	mkdir('./dist/lib');
	mkdir('./dist/lib/xui');
	mkdir('./src');

	cp(src+'/index.html', './dist/');

	cp(src+'/xui.js', './dist/lib/xui/');

	cp(src+'/xui.css', './dist/lib/xui/');
	cp(src+'/background.png', './dist/lib/xui/');
	cp(src+'/pointer.png', './dist/lib/xui/');
	cp(src+'/font-default.css', './dist/lib/xui/');
	cp(src+'/normalize.css', './dist/lib/xui/');

	return;
}