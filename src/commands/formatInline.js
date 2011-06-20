/**
 * formatInline scenarios for tag "B" (| = caret, |foo| = selected text)
 *
 *   #1 caret in unformatted text:
 *      abcdefg|
 *   output:
 *      abcdefg<b>|</b>
 *   
 *   #2 unformatted text selected:
 *      abc|deg|h
 *   output:
 *      abc<b>|deg|</b>h
 *   
 *   #3 unformatted text selected across boundaries:
 *      ab|c <span>defg|h</span>
 *   output:
 *      ab<b>|c </b><span><b>defg</b>|h</span>
 *
 *   #4 formatted text entirely selected
 *      <b>|abc|</b>
 *   output:
 *      |abc|
 *
 *   #5 formatted text partially selected
 *      <b>ab|c|</b>
 *   output:
 *      <b>ab</b>|c|
 *
 *   #6 formatted text selected across boundaries
 *      <span>ab|c</span> <b>de|fgh</b>
 *   output:
 *      <span>ab|c</span> de|<b>fgh</b>
 */
wysihtml5.commands.formatInline = (function() {
  var undef,
      // Treat <b> as <strong> and vice versa
      ALIAS_MAPPING = {
        "strong": "b",
        "em":     "i",
        "b":      "strong",
        "i":      "em"
      },
      cssClassApplier = {};
  
  function _getTagNames(tagName) {
    var alias = ALIAS_MAPPING[tagName];
    return alias ? [tagName.toLowerCase(), alias.toLowerCase()] : [tagName.toLowerCase()];
  }
  
  function _getApplier(tagName, className, classRegExp) {
    var identifier = tagName + ":" + className;
    if (!cssClassApplier[identifier]) {
      cssClassApplier[identifier] = rangy.createCssClassApplier(_getTagNames(tagName), className, classRegExp, true);
    }
    return cssClassApplier[identifier];
  }
  
  function exec(element, command, tagName, className, classRegExp) {
    var range = wysihtml5.utils.caret.getRange(element.ownerDocument);
    if (!range) {
      return false;
    }
    _getApplier(tagName, className, classRegExp).toggleRange(range);
    wysihtml5.utils.caret.setSelection(range);
  }
  
  function state(element, command, tagName, className, classRegExp) {
    var doc           = element.ownerDocument,
        aliasTagName  = ALIAS_MAPPING[tagName] || tagName,
        range;
    
    // Check whether the document contains a node with the desired tagName
    if (!wysihtml5.utils.hasElementWithTagName(doc, tagName) &&
        !wysihtml5.utils.hasElementWithTagName(doc, aliasTagName)) {
      return false;
    }
     
     // Check whether the document contains a node with the desired className
    if (className && !wysihtml5.utils.hasElementWithClassName(doc, className)) {
       return false;
    }
    
    range = wysihtml5.utils.caret.getRange(doc);
    if (!range) {
      return false;
    }
    
    return _getApplier(tagName, className, classRegExp).isAppliedToRange(range);
  }
  
  function value(element, command) {
    // TODO
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();