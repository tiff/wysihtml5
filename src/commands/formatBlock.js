wysihtml5.commands.formatBlock = (function() {
  var undef,
      DEFAULT_NODE_NAME       = "DIV",
      // Following elements are grouped
      // when the caret is within a H1 and the H4 is invoked, the H1 should turn into H4
      // instead of creating a H4 within a H1 which would result in semantically invalid html
      BLOCK_ELEMENTS_GROUP    = ["H1", "H2", "H3", "H4", "H5", "H6", "P", "BLOCKQUOTE", DEFAULT_NODE_NAME];
  
  /**
   * Remove similiar classes (based on classRegExp)
   * and add the desired class name
   */
  function _addClass(element, className, classRegExp) {
    if (element.className) {
      _removeClass(element, classRegExp);
      element.className += " " + className;
    } else {
      element.className = className;
    }
  }
  
  function _removeClass(element, classRegExp) {
    element.className = element.className.replace(classRegExp, "");
  }
  
  /**
   * Check whether given node is a text node and whether it's empty
   */
  function _isBlankTextNode(node) {
    return node.nodeType === Node.TEXT_NODE && String(node.data).blank();
  }
  
  /**
   * Returns previous sibling node that is not a blank text node
   */
  function _getPreviousSiblingThatIsNotBlank(node) {
    var previousSibling = node.previousSibling;
    while (previousSibling && _isBlankTextNode(previousSibling)) {
      previousSibling = previousSibling.previousSibling;
    }
    return previousSibling;
  }
  
  /**
   * Returns next sibling node that is not a blank text node
   */
  function _getNextSiblingThatIsNotBlank(node) {
    var nextSibling = node.nextSibling;
    while (nextSibling && _isBlankTextNode(nextSibling)) {
      nextSibling = nextSibling.nextSibling;
    }
    return nextSibling;
  }
  
  /**
   * Adds line breaks before and after the given node if the previous and next siblings
   * aren't already causing a visual line break (block element or <br>)
   */
  function _addLineBreakBeforeAndAfter(node) {
    var doc             = node.ownerDocument,
        nextSibling     = _getNextSiblingThatIsNotBlank(node),
        previousSibling = _getPreviousSiblingThatIsNotBlank(node);
    
    if (nextSibling && !_isLineBreakOrBlockElement(nextSibling)) {
      node.parentNode.insertBefore(doc.createElement("br"), nextSibling);
    }
    if (previousSibling && !_isLineBreakOrBlockElement(previousSibling)) {
      node.parentNode.insertBefore(doc.createElement("br"), node);
    }
  }
  
  /**
   * Removes line breaks before and after the given node
   */
  function _removeLineBreakBeforeAndAfter(node) {
    var nextSibling     = _getNextSiblingThatIsNotBlank(node),
        previousSibling = _getPreviousSiblingThatIsNotBlank(node);
    
    if (nextSibling && _isLineBreak(nextSibling)) {
      nextSibling.parentNode.removeChild(nextSibling);
    }
    if (previousSibling && _isLineBreak(previousSibling)) {
      previousSibling.parentNode.removeChild(previousSibling);
    }
  }
  
  function _removeLastChildIfLineBreak(node) {
    var lastChild = node.lastChild;
    if (lastChild && _isLineBreak(lastChild)) {
      lastChild.parentNode.removeChild(lastChild);
    }
  }
  
  function _isLineBreak(node) {
    return node.nodeName === "BR";
  }
  
  /**
   * Checks whether the elment causes a visual line break
   * (<br> or block elements)
   */
  function _isLineBreakOrBlockElement(element) {
    if (_isLineBreak(element)) {
      return true;
    }
    
    if (wysihtml5.utils.getStyle(element, "display") === "block") {
      return true;
    }
    
    return false;
  }
  
  /**
   * Execute native query command
   * and if necessary modify the inserted node's className
   */
  function _execCommand(doc, command, nodeName, className) {
    if (className) {
      var eventListener = wysihtml5.utils.observe(doc, "DOMNodeInserted", function(event) {
        var target = event.target,
            displayStyle;
        if (target.nodeType !== Node.ELEMENT_NODE) {
          return;
        }
        displayStyle  = wysihtml5.utils.getStyle(target, "display");
        if (displayStyle.substr(0, 6) !== "inline") {
          // Make sure that only block elements receive the given class
          target.className += " " + className;
        }
      });
    }
    doc.execCommand(command, false, nodeName);
    if (eventListener) {
      eventListener.stop();
    }
  }
  
  function _selectLineAndWrap(element) {
    wysihtml5.utils.caret.selectLine(element.ownerDocument);
    wysihtml5.utils.caret.surround(element);
    _removeLineBreakBeforeAndAfter(element);
    _removeLastChildIfLineBreak(element);
    wysihtml5.utils.caret.selectNode(element);
  }
  
  function _hasClasses(element) {
    return !!element.className.replace(/^\s+/, "").replace(/\s+$/, "");
  }
  
  function exec(element, command, nodeName, className, classRegExp) {
    var doc          = element.ownerDocument,
        blockElement = state(element, command, nodeName, className, classRegExp),
        keepClassName,
        selectedNode;
    
    nodeName = typeof(nodeName) === "string" ? nodeName.toUpperCase() : nodeName;
    
    if (blockElement) {
      wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
        if (classRegExp) {
          _removeClass(blockElement, classRegExp);
        }
        var hasClasses = _hasClasses(blockElement);
        if (!hasClasses && blockElement.nodeName === (nodeName || DEFAULT_NODE_NAME)) {
          // Insert a line break afterwards and beforewards when there are siblings
          // that are not of type line break or block element
          _addLineBreakBeforeAndAfter(blockElement);
          wysihtml5.utils.unwrap(blockElement);
        } else if (hasClasses) {
          // Make sure that styling is kept by renaming the element to <div> and copying over the class name
          wysihtml5.utils.renameElement(blockElement, DEFAULT_NODE_NAME);
        }
      });
      return;
    }
    
    // Find similiar block element and rename it (<h2 class="foo"></h2>  =>  <h1 class="foo"></h1>)
    if (nodeName === null || BLOCK_ELEMENTS_GROUP.indexOf(nodeName) !== -1) {
      selectedNode = wysihtml5.utils.caret.getSelectedNode(doc);
      blockElement = wysihtml5.utils.getParentElement(selectedNode, {
        nodeName:     BLOCK_ELEMENTS_GROUP
      });
      
      if (blockElement) {
        wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
          // Rename current block element to new block element and add class
          if (nodeName) {
            blockElement = wysihtml5.utils.renameElement(blockElement, nodeName);
          }
          if (className) {
            _addClass(blockElement, className, classRegExp);
          }
        });
        return;
      }
    }
    
    if (wysihtml5.commands.support(element, command)) {
      _execCommand(doc, command, nodeName || DEFAULT_NODE_NAME, className);
      return;
    }
    
    blockElement = doc.createElement(nodeName || DEFAULT_NODE_NAME);
    if (className) {
      blockElement.className = className;
    }
    _selectLineAndWrap(blockElement);
  }
  
  function state(element, command, nodeName, className, classRegExp) {
    nodeName = typeof(nodeName) === "string" ? nodeName.toUpperCase() : nodeName;
    var selectedNode = wysihtml5.utils.caret.getSelectedNode(element.ownerDocument);
    return wysihtml5.utils.getParentElement(selectedNode, {
      nodeName:     nodeName,
      className:    className,
      classRegExp:  classRegExp
    });
  }
  
  function value(element, command) {
    return undef;
  }
  
  return {
    BLOCK_ELEMENTS_GROUP: BLOCK_ELEMENTS_GROUP,
    exec:   exec,
    state:  state,
    value:  value
  };
})();