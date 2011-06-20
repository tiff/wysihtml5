wysihtml5.commands.insertHTML = (function() {
  var undef;
  
  function exec(element, command, html) {
    if (wysihtml5.commands.support(element, command)) {
      element.ownerDocument.execCommand(command, false, html);
    } else {
      wysihtml5.utils.caret.insertHTML(element.ownerDocument, html);
    }
  }
  
  function state() {
    return false;
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();