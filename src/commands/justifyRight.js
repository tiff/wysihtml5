wysihtml5.commands.justifyRight = (function() {
  var undef,
      CLASS_NAME  = "wysiwyg-text-align-right",
      REG_EXP     = /wysiwyg-text-align-[a-z]+/g;
  
  function exec(element, command) {
    return wysihtml5.commands.formatBlock.exec(element, "formatBlock", null, CLASS_NAME, REG_EXP);
  }
  
  function state(element, command) {
    return wysihtml5.commands.formatBlock.state(element, "formatBlock", null, CLASS_NAME, REG_EXP);
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