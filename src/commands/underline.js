wysihtml5.commands.underline = (function() {
  var undef,
      REG_EXP     = /wysiwyg-text-decoration-underline/g,
      CLASS_NAME  = "wysiwyg-text-decoration-underline";
  
  function exec(element, command) {
    return wysihtml5.commands.formatInline.exec(element, command, "span", CLASS_NAME, REG_EXP);
  }
  
  function state(element, command) {
    return wysihtml5.commands.formatInline.state(element, command, "span", CLASS_NAME, REG_EXP);
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