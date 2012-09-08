wysihtml5.commands.insertOrderedList = {
  exec: function(composer, command) {
    var doc           = composer.doc,
        selectedNode  = composer.selection.getSelectedNode(),
        list          = wysihtml5.dom.getParentElement(selectedNode, { nodeName: "OL" }),
        otherList     = wysihtml5.dom.getParentElement(selectedNode, { nodeName: "UL" }),
        tempClassName =  "_wysihtml5-temp-" + new Date().getTime(),
        isEmpty,
        tempElement;
    
    if (!list && !otherList && composer.commands.support(command)) {
      doc.execCommand(command, false, null);
      return;
    }
    
    if (list) {
      // Unwrap list
      // <ol><li>foo</li><li>bar</li></ol>
      // becomes:
      // foo<br>bar<br>
      composer.selection.executeAndRestore(function() {
        wysihtml5.dom.resolveList(list, composer.config.useLineBreaks);
      });
    } else if (otherList) {
      // Turn an unordered list into an ordered list
      // <ul><li>foo</li><li>bar</li></ul>
      // becomes:
      // <ol><li>foo</li><li>bar</li></ol>
      composer.selection.executeAndRestore(function() {
        wysihtml5.dom.renameElement(otherList, "ol");
      });
    } else {
      // Create list
      composer.commands.exec("formatBlock", "div", tempClassName);
      tempElement = doc.querySelector("." + tempClassName);
      isEmpty = tempElement.innerHTML === "" || tempElement.innerHTML === wysihtml5.INVISIBLE_SPACE || tempElement.innerHTML === "<br>";
      composer.selection.executeAndRestore(function() {
        list = wysihtml5.dom.convertToList(tempElement, "ol");
      });
      if (isEmpty) {
        composer.selection.selectNode(list.querySelector("li"), true);
      }
    }
  },
  
  state: function(composer) {
    var selectedNode = composer.selection.getSelectedNode();
    return wysihtml5.dom.getParentElement(selectedNode, { nodeName: "OL" });
  }
};