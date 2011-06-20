wysihtml5.commands.italic = (function() {
  var undef;
  
  function exec(element, command) {
    return wysihtml5.commands.formatInline.exec(element, command, "i");
  }
  
  function state(element, command, color) {
    // element.ownerDocument.queryCommandState("italic") results:
    // firefox: only <i>
    // chrome:  <i>, <em>, <blockquote>, ...
    // ie:      <i>, <em>
    // opera:   only <i>
    return wysihtml5.commands.formatInline.state(element, command, "i");
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