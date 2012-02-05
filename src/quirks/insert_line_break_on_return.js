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
      USE_NATIVE_LINE_BREAK_WHEN_CARET_INSIDE_TAGS  = ["LI", "P", "H1", "H2", "H3", "H4", "H5", "H6"],
      LIST_TAGS                                     = ["UL", "OL", "MENU"];
  
  function keyDown(event) {
    var keyCode = event.keyCode;
    
    if (event.shiftKey || (keyCode !== wysihtml5.ENTER_KEY && keyCode !== wysihtml5.BACKSPACE_KEY)) {
      return;
    }
    
    var element         = event.target,
        selectedNode    = wysihtml5.selection.getSelectedNode(),
        blockElement    = dom.getParentElement(selectedNode, { nodeName: USE_NATIVE_LINE_BREAK_WHEN_CARET_INSIDE_TAGS }, 4);
    
    if (blockElement) {
      // IE and Opera create <p> elements after leaving a list
      // check after keypress of backspace and return whether a <p> got inserted and unwrap it
      if (blockElement.nodeName === "LI" && (keyCode === wysihtml5.ENTER_KEY || keyCode === wysihtml5.BACKSPACE_KEY)) {
        setTimeout(function() {
          var selectedNode = wysihtml5.selection.getSelectedNode(),
              list,
              invisibleSpace,
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
          
          var parentElement = dom.getParentElement(selectedNode, { nodeName: ["P", "DIV"] }, 2);
          if (!parentElement) {
            return;
          }
          
          invisibleSpace = document.createTextNode(wysihtml5.INVISIBLE_SPACE);
          dom.insert(invisibleSpace).before(parentElement);
          dom.replaceWithChildNodes(parentElement);
          wysihtml5.selection.selectNode(invisibleSpace);
        }, 0);
      }
      return;
    }
    
    if (keyCode === wysihtml5.ENTER_KEY) {
      wysihtml5.commands.exec("insertLineBreak");
      event.preventDefault();
    }
  }
  
  wysihtml5.quirks.insertLineBreakOnReturn = function(element) {
    // keypress doesn't fire when you hit backspace
    dom.observe(element.ownerDocument, "keydown", keyDown);
  };
})(wysihtml5);