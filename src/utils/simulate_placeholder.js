/**
 * Simulate HTML5 placeholder attribute
 *
 * Needed since
 *    - div[contentEditable] elements don't support it
 *    - older browsers (such as IE8 and Firefox 3.6) don't support it at all
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @param {Object} parent Instance of main wysihtml5.Editor class
 * @param {Element} view Instance of wysihtml5.views.* class
 * @param {String} placeholderText
 *
 * @example
 *    wysihtml.utils.simulatePlaceholder(this, composer, "Foobar");
 */
wysihtml5.utils.simulatePlaceholder = function(parent, view, placeholderText) {
  var unset = function() {
        if (view.hasPlaceholderSet()) {
          view.clear();
        }
        Element.removeClassName(view.element, "placeholder");
      },
      set = function() {
        if (view.isEmpty()) {
          view.setValue(placeholderText);
          Element.addClassName(view.element, "placeholder");
        }
      };
  
  parent
    .observe("set_placeholder", set)
    .observe("unset_placeholder", unset)
    .observe("focus:composer", unset)
    .observe("paste:composer", unset)
    .observe("blur:composer", set);
  
  set();
};