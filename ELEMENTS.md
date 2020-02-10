# XUI Elements

Below is the list of all elements bundled with XUI:

[Dialog](#dialog)

# Dialog
[Go Back](#xui-elements)

Container for other elements, has a header bar and a content area.

```html
<xui-dialog>
	<div class="header">
		<b>Title</b>

		<span>
			<i data-action="hide" class="fas fa-times"></i>
		</span>
	</div>
</xui-dialog>
```

## Modifiers

|Class						|Description|
|-							|-|
|.x-draggable				|Allows the dialog to be dragged by its header.|
|.x-buttons-left			|The header buttons are shown on the left side.|
|.x-buttons-hidden			|Header buttons are not shown.|
|.x-title-right				|The dialog title text is aligned to the right.|
|.x-title-center			|The dialog title text is centered.|
|.x-title-bold				|Title text style is bold.|

## Actions

|Name						|Description|
|-							|-|
|hide()						|Hides the dialog.|
|show()						|Shows the dialog.|
