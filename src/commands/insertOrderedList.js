(function(wysihtml5) {
  var undef;
  
  wysihtml5.commands.insertOrderedList = {
    exec: function(element, command) {
      var doc = element.ownerDocument,
          selectedNode,
          isEmpty,
          tempElement,
          list;

      if (wysihtml5.commands.support(command)) {
        doc.execCommand(command, false, null);
      } else {
        selectedNode = wysihtml5.selection.getSelectedNode();
        list = wysihtml5.dom.getParentElement(selectedNode, { nodeName: ["UL", "OL"] }, 4);
        if (!list) {
          tempElement = doc.createElement("span");
          wysihtml5.selection.surround(tempElement);
          isEmpty = tempElement.innerHTML === "" || tempElement.innerHTML === wysihtml5.INVISIBLE_SPACE;
          wysihtml5.selection.executeAndRestoreSimple(function() {
            list = wysihtml5.dom.convertToList(tempElement, "ol");
          });

          if (isEmpty) {
            wysihtml5.selection.selectNode(list.querySelector("li"));
          }
          return;
        }

        wysihtml5.selection.executeAndRestoreSimple(function() {
          if (list.nodeName === "OL") {
            // Unwrap list
            // <ol><li>foo</li><li>bar</li></ol>
            // becomes:
            // foo<br>bar<br>
            wysihtml5.dom.resolveList(list);
          } else if (list.nodeName === "UL" || list.nodeName === "MENU") {
            // Turn an unordered list into an ordered list
            // <ul><li>foo</li><li>bar</li></ul>
            // becomes:
            // <ol><li>foo</li><li>bar</li></ol>
            wysihtml5.dom.renameElement(list, "ol");
          }
        });
      }
    },

    state: function(element, command) {
      try {
        return element.ownerDocument.queryCommandState(command);
      } catch(e) {
        return false;
      }
    },

    value: function() {
      return undef;
    }
  };
})(wysihtml5);