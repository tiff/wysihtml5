/**
 * execCommand("fontSize") will create either inline styles (firefox, chrome) or use font tags
 * which we don't want
 * Instead we set a css class
 */
wysihtml5.commands.fontSize = (function() {
  var undef,
      REG_EXP = /wysiwyg-font-size-[a-z]+/g;
  
  function exec(element, command, size) {
    return wysihtml5.commands.formatInline.exec(element, command, "span", "wysiwyg-font-size-" + size, REG_EXP);
  }
  
  function state(element, command, size) {
    return wysihtml5.commands.formatInline.state(element, command, "span", "wysiwyg-font-size-" + size, REG_EXP);
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