wysihtml5.commands.insertLineBreak = (function() {
  var undef,
      LINE_BREAK = "<br>" + (Prototype.Browser.Opera ? " " : "");
  
  function exec(element, command) {
    if (wysihtml5.commands.support(element, command)) {
      element.ownerDocument.execCommand(command, false, null);
      if (!wysihtml5.browserSupports.autoScrollIntoViewOfCaret()) {
        wysihtml5.utils.caret.scrollIntoView(element);
      }
    } else {
      wysihtml5.commands.exec(element, "insertHTML", LINE_BREAK);
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