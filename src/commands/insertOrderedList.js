wysihtml5.commands.insertOrderedList = (function() {
  var undef;
  
  function exec(element, command) {
    var doc = element.ownerDocument,
        selectedNode,
        isEmpty,
        tempElement,
        list;
    
    if (wysihtml5.commands.support(element, command)) {
      doc.execCommand(command, false, null);
    } else {
      selectedNode = wysihtml5.utils.caret.getSelectedNode(doc);
      list = wysihtml5.utils.getParentElement(selectedNode, { nodeName: ["UL", "OL"] }, 4);
      if (!list) {
        tempElement = doc.createElement("span");
        wysihtml5.utils.caret.surround(tempElement);
        isEmpty = tempElement.innerHTML === "" || tempElement.innerHTML === "\uFEFF";
        wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
          list = wysihtml5.utils.convertIntoList(tempElement, "ol");
        });
        
        if (isEmpty) {
          wysihtml5.utils.caret.selectNode(list.querySelector("li"));
        }
        return;
      }
      
      wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
        if (list.nodeName === "OL") {
          // Unwrap list
          // <ol><li>foo</li><li>bar</li></ol>
          // becomes:
          // foo<br>bar<br>
          wysihtml5.utils.resolveList(list);
        } else if (list.nodeName === "UL" || list.nodeName === "MENU") {
          // Turn an unordered list into an ordered list
          // <ul><li>foo</li><li>bar</li></ul>
          // becomes:
          // <ol><li>foo</li><li>bar</li></ol>
          wysihtml5.utils.renameElement(list, "ol");
        }
      });
    }
  }
  
  function state(element, command) {
    try {
      return element.ownerDocument.queryCommandState(command);
    } catch(e) {
      return false;
    }
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();