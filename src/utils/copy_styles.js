/**
 * Copy a set of styles from one element to another
 * Please note that this only works properly across browsers when the element from which to copy the styles
 * is in the dom
 *
 * Interesting article on how to copy styles
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @param {Array} stylesToCopy List of styles which should be copied
 * @return {Object} Returns an object which offers the "from" method which can be invoked with the element where to
 *    copy the styles from., this again returns an object which provides a method named "to" which can be invoked 
 *    with the element where to copy the styles to (see example)
 *
 * @example
 *    var textarea    = $("textarea"),
 *        div         = $$("div[contenteditable=true]")[0],
 *        anotherDiv  = $$("div[contenteditable=true]")[1];
 *    wysihtml5.utils.copyStyles("width", "height").from(textarea).to(div);
 *    // or (advanced example):
 *    wysihtml5.utils.copyStyles(["overflow-y", "width", "height"]).from(textarea).to(div).andTo(anotherDiv);
 *
 */
wysihtml5.utils.copyStyles = (function() {
  
  /**
   * Mozilla and Opera recalculate the computed width when box-sizing: boder-box; is set
   * So if an element has "width: 200px; -moz-box-sizing: border-box; border: 1px;" then 
   * it's computed css width will be 198px
   */
  var BOX_SIZING_PROPERTIES = ["-webkit-box-sizing", "-moz-box-sizing", "-ms-box-sizing", "box-sizing"];
  
  var shouldIgnoreBoxSizingBorderBox = function(element) {
    if (hasBoxSizingBorderBox(element)) {
       return parseInt(wysihtml5.utils.getStyle(element, "width"), 10) < element.getWidth();
    }
    return false;
  };
  
  var hasBoxSizingBorderBox = function(element) {
    return BOX_SIZING_PROPERTIES.find(function(property) {
      return wysihtml5.utils.getStyle(element, property) == "border-box";
    });
  };
  
  return function(stylesToCopy) {
    stylesToCopy = $A(arguments).flatten();
    
    return {
      from: function(element) {
        if (shouldIgnoreBoxSizingBorderBox(element)) {
          stylesToCopy = stylesToCopy.without.apply(stylesToCopy, BOX_SIZING_PROPERTIES);
        }
        
        var cssText = stylesToCopy.inject("", function(str, property) {
          var propertyValue = wysihtml5.utils.getStyle(element, property);
          if (propertyValue) {
            str += property + ":" + propertyValue + ";";
          }
          return str;
        });
        
        return {
          to: function(element) {
            /**
             * Use static Element.setStyle method, since element is not
             * necessarily prototype extended
             */
            Element.setStyle(element, cssText);
            return { andTo: arguments.callee };
          }
        };
      }
    };
  };
})();