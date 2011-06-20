/**
 * Get element's style for a specific css property
 *
 * @param {Element} element The element on which to retrieve the style
 * @param {String} property The CSS property to retrieve ("float", "display", "text-align", ...)
 * @author Christopher Blum <christopher.blum@xing.com>
 * @example
 *    wysihtml5.utils.getStyle(document.body, "display");
 *    // => "block"
 */
wysihtml5.utils.getStyle = (function() {
  var currentStylePropertyMapping = {
    "float": "styleFloat"
  };
  
  return function(element, property) {
    if (element.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    
    // currentStyle is no standard and only supported by Opera and IE but it has one important advantage over the standard-compliant
    // window.getComputedStyle, since it returns css property values in their original unit:
    // If you set an elements width to "50%", window.getComputedStyle will give you it's current width in px while currentStyle
    // gives you the original "50%".
    // Opera supports both, currentStyle and window.getComputedStyle, that's why checking for currentStyle should have higher prio
    if (element.currentStyle) {
      property = currentStylePropertyMapping[property] || property.camelize();
      return element.currentStyle[property];
    }

    var win                 = element.ownerDocument.defaultView || element.ownerDocument.parentWindow,
        needsOverflowReset  = (property === "height" || property === "width") && element.nodeName === "TEXTAREA",
        originalOverflow,
        returnValue;
    
    if (win.getComputedStyle) {
      // Chrome and Safari both calculate a wrong width and height for textareas when they have scroll bars
      // therfore we remove and restore the scrollbar and calculate the value in between
      if (needsOverflowReset) {
        originalOverflow = element.style.overflow;
        element.style.overflow = "hidden";
      }
      returnValue = win.getComputedStyle(element, null).getPropertyValue(property);
      if (needsOverflowReset) {
        element.style.overflow = originalOverflow || "";
      }
      return returnValue;
    }
  };
})();