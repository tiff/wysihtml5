/**
 * Some browsers don't insert line breaks when hitting return in a contentEditable element
 *    - Opera & IE insert new <p> on return
 *    - Chrome & Safari insert new <div> on return
 *    - Firefox inserts <br> on return (yippie!)
 
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @param {Element} element
 *
 * @example
 *    wysihtml5.quirks.insertLineBreakOnReturn(element);
 */
wysihtml5.quirks.insertLineBreakOnReturn = (function() {
  var USE_NATIVE_LINE_BREAK_WHEN_CARET_INSIDE_TAGS  = ["LI", "DIV", "P", "H1", "H2", "H3", "H4", "H5", "H6"],
      LIST_TAGS                                     = ["UL", "OL", "MENU"],
      BACKSPACE_KEY                                 = 8,
      RETURN_KEY                                    = 13;
  
  var keyPress = function(event) {
    if (event.shiftKey || (event.keyCode !== RETURN_KEY && event.keyCode !== BACKSPACE_KEY)) {
      return;
    }
    
    var element         = event.target,
        selectedNode    = wysihtml5.utils.caret.getSelectedNode(element.ownerDocument),
        blockElement    = wysihtml5.utils.getParentElement(selectedNode, { nodeName: USE_NATIVE_LINE_BREAK_WHEN_CARET_INSIDE_TAGS }, 4);
    
    if (blockElement) {
      // IE and Opera create <p> elements after leaving a list
      // check after keypress of backspace and return whether a <p> got inserted and unwrap it
      if (blockElement.nodeName === "LI" && (event.keyCode === RETURN_KEY || event.keyCode === BACKSPACE_KEY)) {
        setTimeout(function() {
          var selectedNode = wysihtml5.utils.caret.getSelectedNode(element.ownerDocument),
              list,
              div;
          if (!selectedNode) {
            return;
          }
          
          list = wysihtml5.utils.getParentElement(selectedNode, {
            nodeName: LIST_TAGS
          }, 2);
          
          if (list) {
            return;
          }
          if (selectedNode.parentNode.nodeName === "P") {
            div = wysihtml5.utils.renameElement(selectedNode.parentNode, "div");
            wysihtml5.utils.caret.selectNode(div);
          }
        }, 0);
      }
      return;
    }
    
    if (event.keyCode === RETURN_KEY) {
      wysihtml5.commands.exec(element, "insertLineBreak");
      event.preventDefault();
    }
  };
  
  return function(element) {
    // keypress doesn't fire when you hit backspace
    wysihtml5.utils.observe(element.ownerDocument, "keydown", keyPress);
  };
})();