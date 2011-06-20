/**
 * Copy a set of attributes from one element to another
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @param {Array} attributesToCopy List of attributes which should be copied
 * @return {Object} Returns an object which offers the "from" method which can be invoked with the element where to
 *    copy the attributes from., this again returns an object which provides a method named "to" which can be invoked 
 *    with the element where to copy the attributes to (see example)
 *
 * @example
 *    var textarea    = $("textarea"),
 *        div         = $$("div[contenteditable=true]")[0],
 *        anotherDiv  = $$("div[contenteditable=true]")[1];
 *    wysihtml5.utils.copyAttributes("spellcheck", "value", "placeholder").from(textarea).to(div);
 *    // or (advanced example):
 *    wysihtml5.utils.copyAttributes(["spellcheck", "value", "placeholder"]).from(textarea).to(div).andTo(anotherDiv);
 *
 */
wysihtml5.utils.copyAttributes = function(attributesToCopy) {
  attributesToCopy = $A(arguments).flatten();
  
  return {
    from: function(elementToCopyFrom) {
      return {
        to: function(elementToCopyTo) {
          attributesToCopy.each(function(attribute) {
            if (elementToCopyFrom[attribute]) {
              elementToCopyTo[attribute] = elementToCopyFrom[attribute];
            }
          });
          return { andTo: arguments.callee };
        }
      };
    }
  };
};