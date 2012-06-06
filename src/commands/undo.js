(function() {
  var undef;
  wysihtml5.commands.undo = {
    exec: function(composer) {
      return composer.undoManager.undo();
    },

    state: function(composer) {
      return false;
    },

    value: function() {
      return undef;
    }
  };
})();