/**
 * Simulate HTML5 autofocus
 * Needed since div[contentEditable] elements don't support it
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} element The element which should be focussed
 * @example
 *    wysihtml5.utils.autoFocus(element);
 */
wysihtml5.utils.autoFocus = function(element) {
  if (document.loaded) {
    setTimeout(function() { element.focus(); }, 0);
  } else {
    document.observe("dom:loaded", function() { element.focus(); });
  }
};
