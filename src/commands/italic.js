wysihtml5.commands.italic = {
  exec: function(composer, command) {
    return wysihtml5.commands.formatInline.exec(composer, command, "i");
  },

  state: function(composer, command) {
    // element.ownerDocument.queryCommandState("italic") results:
    // firefox: only <i>
    // chrome:  <i>, <em>, <blockquote>, ...
    // ie:      <i>, <em>
    // opera:   only <i>
    return wysihtml5.commands.formatInline.state(composer, command, "i");
  }
};