(function(wysihtml5) {
  var undef;
  
  wysihtml5.commands.insertUnorderedList = {
    exec: function(composer, command) {
      var doc = composer.doc,
          selectedNode,
          isEmpty,
          tempElement,
          list;

      if (composer.commands.support(command)) {
        doc.execCommand(command, false, null);
      } else {
        selectedNode = composer.selection.getSelectedNode();
        list = wysihtml5.dom.getParentElement(selectedNode, { nodeName: ["UL", "OL"] });

        if (!list) {
          tempElement = doc.createElement("span");
          composer.selection.surround(tempElement);
          isEmpty = tempElement.innerHTML === "" || tempElement.innerHTML === wysihtml5.INVISIBLE_SPACE;
          composer.selection.executeAndRestoreSimple(function() {
            list = wysihtml5.dom.convertToList(tempElement, "ul");
          });

          if (isEmpty) {
            composer.selection.selectNode(list.querySelector("li"));
          }
          return;
        }

        composer.selection.executeAndRestoreSimple(function() {
          if (list.nodeName === "UL") {
            // Unwrap list
            // <ul><li>foo</li><li>bar</li></ul>
            // becomes:
            // foo<br>bar<br>
            wysihtml5.dom.resolveList(list);
          } else if (list.nodeName === "OL" || list.nodeName === "MENU") {
            // Turn an ordered list into an unordered list
            // <ol><li>foo</li><li>bar</li></ol>
            // becomes:
            // <ul><li>foo</li><li>bar</li></ul>
            wysihtml5.dom.renameElement(list, "ul");
          }
        });
      }
    },

    state: function(composer, command) {
      try {
        return composer.doc.queryCommandState(command);
      } catch(e) {
        return false;
      }
    },

    value: function() {
      return undef;
    }
  };
})(wysihtml5);