/**
 * Force rerendering of a given element
 * Needed to fix display misbehaviors of IE
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} element The element object which needs to be rerendered
 * @example
 *    wysihtml5.quirks.redraw(document.body);
 */
wysihtml5.quirks.redraw = (function() {
  var CLASS_NAME = "wysihtml5-quirks-redraw";
  return function(element) {
    Element.addClassName(element, CLASS_NAME)
    Element.removeClassName(element, CLASS_NAME);
    
    // Following hack is needed for firefox to make sure that image resize handles are properly removed
    try {
      var doc = element.ownerDocument;
      doc.execCommand("italic", false, null);
      doc.execCommand("italic", false, null);
    } catch(e) {}
  };
})();
