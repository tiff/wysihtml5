(function(wysihtml5) {
  var undef;
  
  wysihtml5.commands.italic = {
    exec: function(element, command) {
      return wysihtml5.commands.formatInline.exec(element, command, "i");
    },

    state: function(element, command, color) {
      // element.ownerDocument.queryCommandState("italic") results:
      // firefox: only <i>
      // chrome:  <i>, <em>, <blockquote>, ...
      // ie:      <i>, <em>
      // opera:   only <i>
      return wysihtml5.commands.formatInline.state(element, command, "i");
    },

    value: function() {
      return undef;
    }
  };
})(wysihtml5);