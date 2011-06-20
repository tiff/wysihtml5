wysihtml5.commands.bold = (function() {
  var undef;
  
  function exec(element, command) {
    return wysihtml5.commands.formatInline.exec(element, command, "b");
  }
  
  function state(element, command, color) {
    // element.ownerDocument.queryCommandState("bold") results:
    // firefox: only <b>
    // chrome:  <b>, <strong>, <h1>, <h2>, ...
    // ie:      <b>, <strong>
    // opera:   <b>, <strong>
    return wysihtml5.commands.formatInline.state(element, command, "b");
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