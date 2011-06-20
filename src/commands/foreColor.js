/**
 * execCommand("foreColor") will create either inline styles (firefox, chrome) or use font tags
 * which we don't want
 * Instead we set a css class
 */
wysihtml5.commands.foreColor = (function() {
  var undef,
      REG_EXP = /wysiwyg-color-[a-z]+/g;
  
  function exec(element, command, color) {
    return wysihtml5.commands.formatInline.exec(element, command, "span", "wysiwyg-color-" + color, REG_EXP);
  }
  
  function state(element, command, color) {
    return wysihtml5.commands.formatInline.state(element, command, "span", "wysiwyg-color-" + color, REG_EXP);
  }
  
  function value() {
    // TODO
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();