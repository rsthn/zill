export class zl
{
	/**
	 * Registered elements with the `register` method.
	 */
	static elements: Array<object>;

	/**
	 * Compiles a violet template and returns the evaluator function.
	 * @param {string} str - Template to compile.
	 * @returns {(data) => string}
	 */
	static template(str);

	/**
	 * Registers a new custom element with the specified name and prototypes.
	 * @param {string} name - Name of the element. Must be unique.
	 * @param  {...any} protos - Prototypes or super class names to add to the element.
	 */
	static register (name, ...protos);

	/**
	 * Aligns the specified value such that it is a factor of the given step.
	 * @param {numbe} value - Value to align.
	 * @param {number} step - Step to align the value to.
	 * @returns {number}
	 */
	static alignValue (value, step);

	/**
	 * Returns `true` if the rectangles overlap.
	 * @param {DOMRect} rect1 - First rectangle.
	 * @param {DOMRect} rect2 - Second rectangle.
	 * @returns {boolean}
	 */
	static overlapTes (rect1, rect2);

	/**
	 * Utility methods related to element position.
	 */
	static position = {

	}
	/**
	 * Utility methods to add drag support to elements.
	 */
	static draggable = {

	/**
	 * Attaches draggable support to the specified element.
	 * @param {Element} handle - Drag handle element.
	 * @param {Element} target - Target draggable element (container).
	 * @param {string} group? - Name of the draggable group.
	 * @returns {void}
	 */
	static attach (handle, target, group);

	}
	/**
	 * Utility methods to add scroll support to elements.
	 */
	static scrollable = {

	/**
	 * Attaches scroll support to the specified element.
	 * @param {Element} target - Element to attach the scroll support.
	 * @returns void
	 */
	static attach (target);

	}
	/**
	 * Utility methods to add text editing support to elements.
	 */
	static editable = {

	/**
	 * Attaches an editable to the specified target. The callback(new_value, old_value) is called when an event on the input happens (blur, ENTER-key, ESC-key),
	 * and if the callback returns false editing will continue (and the input will be re-focused), if the callback returns true nothing will be done, and if
	 * any other value is returned, it will be used as the new text content of the target. A new_value of null is sent to the callback when ESC or onblur happens.
	 *
	 * @param {Element} target - Element to add the edition support.
	 * @param {string} prev_value - Previous value prior to edition.
	 * @param {(curValue:string, prevValue:string) => boolean)} callback - Callback to validate the values.
	 * @returns {void}
	 */
	static attach (target, prev_value, callback);

	}
	/**
	 * Utility methods to add selection support to elements.
	 */
	static selectable = {

	/**
	 * Adds selection support to the specified element. Event `onSelectionChanged` will be triggered on the element whenever the selection changes.
	 * Attribute `selection` of the element will have the list of items selected.
	 * @param {Element} target - Element to add the selection support.
	 */
	static attach (target);

	}
	/**
	 * Forces the browser to show a download dialog.
	 * @param {string} filename - Filename to show in the download dialog.
	 * @param {string} dataUrl - Data URI to download.
	 */
	static showDownload (filename, dataUrl);

	/**
	 * Forces the browser to show a file selection dialog.
	 * @param {boolean} allowMultiple - Set to `true` to allow multiple selections.
	 * @param {string} accept - Accepted MIME types.
	 * @param {(Array<File>) => void} callback - Callback used to handle the selected files.
	 */
	static showFilePicker (allowMultiple, accept, callback);

	/**
	 * Loads a file using FileReader and returns the result as a dataURL.
	 * @param {File} file - File to load.
	 * @param {(dataUrl:string) => void} callback
	 */
	loadAsDataURL (file, callback);

	/**
	 * Loads a file using FileReader and returns the result as text.
	 * @param {File} file - File to load.
	 * @param {(text:string) => void)} callback
	 */
	static loadAsText (file, callback);

	/**
	 * Loads a file using FileReader and returns the result as an array buffer.
	 * @param {File} file - File to load.
	 * @param {(value:ArrayBuffer) => void} callback
	 */
	static loadAsArrayBuffer (file, callback);

	/**
	 * Loads an array of File objects using FileReader and returns them as data URLs.
	 * @param {Array<File>} fileList - Files to load.
	 * @param {Array<string>} callback
	 * @returns {void}
	 */
	static loadAllAsDataURL (fileList, callback);

}