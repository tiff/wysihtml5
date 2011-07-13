/**
 * document.execCommand("fontSize") will create either inline styles (firefox, chrome) or use font tags
 * which we don't want
 * Instead we set a css class
 */
(function(wysihtml5) {
  var undef,
      REG_EXP = /wysiwyg-font-size-[a-z]+/g;
  
  wysihtml5.commands.fontSize = {
    exec: function(element, command, size) {
      return wysihtml5.commands.formatInline.exec(element, command, "span", "wysiwyg-font-size-" + size, REG_EXP);
    },

    state: function(element, command, size) {
      return wysihtml5.commands.formatInline.state(element, command, "span", "wysiwyg-font-size-" + size, REG_EXP);
    },

    value: function() {
      return undef;
    }
  };
})(wysihtml5);
