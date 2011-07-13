(function(wysihtml5) {
  var undef,
      CLASS_NAME  = "wysiwyg-text-align-center",
      REG_EXP     = /wysiwyg-text-align-[a-z]+/g;
  
  wysihtml5.commands.justifyCenter = {
    exec: function(element, command) {
      return wysihtml5.commands.formatBlock.exec(element, "formatBlock", null, CLASS_NAME, REG_EXP);
    },

    state: function(element, command) {
      return wysihtml5.commands.formatBlock.state(element, "formatBlock", null, CLASS_NAME, REG_EXP);
    },

    value: function() {
      return undef;
    }
  };
})(wysihtml5);