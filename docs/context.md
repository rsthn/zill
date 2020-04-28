# Context Menu

Defines a context menu that is activated when the `contextmenu` event is detected on a set of elements matching the selector defined in the `data-target` attribute.

All actions defined by `data-action` attributes are executed on the `root` of the context menu instead of on itself, additionally the `source` attribute of the event is set to the target element that triggered the context menu.

### Sample Code

```html
<xui-context data-target=".selector">
    <ul>
        <li><em>Title</em></li>
        <li><b data-action="actionA">Run Action A</b></li>
        <li class="sub-menu">
            <b>Sub Menu</b>
            <ul>
                <li><b data-action="actionB">Action B</b></li>
                <li><b data-action="actionC">Action C</b></li>
                <li><b data-action="actionD">Action D</b></li>
            </ul>
        </li>
    </ul>
</xui-context>
```

### Preview
![xui-context](./img/xui-context.png)


&nbsp;<br/>
## Attributes

|Attribute Name|Required|Description
|-|-|-
|data-target|`true`|A CSS selector for the elements on which the `oncontextmenu` event should be watched. Therefore right-clicking in any elements that matches this selector will result in the context menu being shown.


&nbsp;<br/>
## Inherited CSS Classes

- [`.xui-dropdown`](./dropdown.md)
