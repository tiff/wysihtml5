(function(wysihtml5) {
  var undef;
  
  wysihtml5.commands.bold = {
    exec: function(element, command) {
      return wysihtml5.commands.formatInline.exec(element, command, "b");
    },

    state: function(element, command, color) {
      // element.ownerDocument.queryCommandState("bold") results:
      // firefox: only <b>
      // chrome:  <b>, <strong>, <h1>, <h2>, ...
      // ie:      <b>, <strong>
      // opera:   <b>, <strong>
      return wysihtml5.commands.formatInline.state(element, command, "b");
    },

    value: function() {
      return undef;
    }
  };
})(wysihtml5);

