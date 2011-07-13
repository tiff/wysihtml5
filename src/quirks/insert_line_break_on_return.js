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
(function(wysihtml5) {
  var dom                                           = wysihtml5.dom,
      USE_NATIVE_LINE_BREAK_WHEN_CARET_INSIDE_TAGS  = ["LI", "DIV", "P", "H1", "H2", "H3", "H4", "H5", "H6"],
      LIST_TAGS                                     = ["UL", "OL", "MENU"];
  
  function keyPress(event) {
    var keyCode = event.keyCode;
    
    if (event.shiftKey || (keyCode !== wysihtml5.ENTER_KEY && keyCode !== wysihtml5.BACKSPACE_KEY)) {
      return;
    }
    
    var element         = event.target,
        selectedNode    = wysihtml5.selection.getSelectedNode(element.ownerDocument),
        blockElement    = dom.getParentElement(selectedNode, { nodeName: USE_NATIVE_LINE_BREAK_WHEN_CARET_INSIDE_TAGS }, 4);
    
    if (blockElement) {
      // IE and Opera create <p> elements after leaving a list
      // check after keypress of backspace and return whether a <p> got inserted and unwrap it
      if (blockElement.nodeName === "LI" && (keyCode === wysihtml5.ENTER_KEY || keyCode === wysihtml5.BACKSPACE_KEY)) {
        setTimeout(function() {
          var selectedNode = wysihtml5.selection.getSelectedNode(element.ownerDocument),
              list,
              div;
          if (!selectedNode) {
            return;
          }
          
          list = dom.getParentElement(selectedNode, {
            nodeName: LIST_TAGS
          }, 2);
          
          if (list) {
            return;
          }
          if (selectedNode.parentNode.nodeName === "P") {
            div = dom.renameElement(selectedNode.parentNode, "div");
            wysihtml5.selection.selectNode(div);
          }
        }, 0);
      }
      return;
    }
    
    if (keyCode === wysihtml5.ENTER_KEY) {
      wysihtml5.commands.exec(element, "insertLineBreak");
      event.preventDefault();
    }
  }
  
  wysihtml5.quirks.insertLineBreakOnReturn = function(element) {
    // keypress doesn't fire when you hit backspace
    dom.observe(element.ownerDocument, "keydown", keyPress);
  };
})(wysihtml5);