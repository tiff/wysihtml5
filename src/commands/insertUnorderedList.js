wysihtml5.commands.insertUnorderedList = (function() {
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
      list = wysihtml5.utils.getParentElement(selectedNode, { nodeName: ["UL", "OL"] });
      
      if (!list) {
        tempElement = doc.createElement("span");
        wysihtml5.utils.caret.surround(tempElement);
        isEmpty = tempElement.innerHTML === "" || tempElement.innerHTML === "\uFEFF";
        wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
          list = wysihtml5.utils.convertIntoList(tempElement, "ul");
        });
        
        if (isEmpty) {
          wysihtml5.utils.caret.selectNode(list.querySelector("li"));
        }
        return;
      }
      
      wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
        if (list.nodeName === "UL") {
          // Unwrap list
          // <ul><li>foo</li><li>bar</li></ul>
          // becomes:
          // foo<br>bar<br>
          wysihtml5.utils.resolveList(list);
        } else if (list.nodeName === "OL" || list.nodeName === "MENU") {
          // Turn an ordered list into an unordered list
          // <ol><li>foo</li><li>bar</li></ol>
          // becomes:
          // <ul><li>foo</li><li>bar</li></ul>
          wysihtml5.utils.renameElement(list, "ul");
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