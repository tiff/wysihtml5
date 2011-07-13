(function(wysihtml5) {
  var undef,
      REG_EXP     = /wysiwyg-text-decoration-underline/g,
      CLASS_NAME  = "wysiwyg-text-decoration-underline";
  
  wysihtml5.commands.underline = {
    exec: function(element, command) {
      return wysihtml5.commands.formatInline.exec(element, command, "span", CLASS_NAME, REG_EXP);
    },

    state: function(element, command) {
      return wysihtml5.commands.formatInline.state(element, command, "span", CLASS_NAME, REG_EXP);
    },

    value: function() {
      return undef;
    }
  };
})(wysihtml5);