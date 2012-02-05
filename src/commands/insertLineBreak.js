(function(wysihtml5) {
  var undef,
      LINE_BREAK = "<br>" + (wysihtml5.browser.needsSpaceAfterLineBreak() ? " " : "");
  
  wysihtml5.commands.insertLineBreak = {
    exec: function(element, command) {
      if (wysihtml5.commands.support(command)) {
        element.ownerDocument.execCommand(command, false, null);
        if (!wysihtml5.browser.autoScrollsToCaret()) {
          wysihtml5.selection.scrollIntoView(element);
        }
      } else {
        wysihtml5.commands.exec("insertHTML", LINE_BREAK);
      }
    },

    state: function() {
      return false;
    },

    value: function() {
      return undef;
    }
  };
})(wysihtml5);