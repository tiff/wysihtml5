wysihtml5.commands.createLink = (function() {
  var undef,
      NODE_NAME = "A";
  
  function _removeFormat(element, anchors) {
    var length = anchors.length,
        i      = 0,
        anchor,
        codeElement,
        textContent;
    for (; i<length; i++) {
      anchor      = anchors[i];
      codeElement = wysihtml5.utils.getParentElement(anchor, { nodeName: "code" });
      textContent = wysihtml5.utils.getTextContent(anchor);
      
      // if <a> contains url-like text content, rename it to <code> to prevent re-autolinking
      // else replace <a> with its childNodes
      if (textContent.match(wysihtml5.utils.autoLink.URL_REG_EXP) && !codeElement) {
        // <code> element is used to prevent later auto-linking of the content
        codeElement = wysihtml5.utils.renameElement(anchor, "code");
      } else {
        wysihtml5.utils.unwrap(anchor);
      }
    }
  }
  
  function _format(element, attributes) {
    var doc             = element.ownerDocument,
        tempClass       = "_wysihtml5-temp-" + new Date().getTime(),
        tempClassRegExp = /non-matching-class/g,
        i               = 0,
        length,
        anchors,
        anchor,
        hasElementChild,
        isEmpty,
        elementToSetCaretAfter,
        textContent,
        whiteSpace,
        j;
    wysihtml5.commands.formatInline.exec(element, undef, NODE_NAME, tempClass, tempClassRegExp);
    anchors = doc.querySelectorAll(NODE_NAME + "." + tempClass);
    length  = anchors.length;
    for (; i<length; i++) {
      anchor = anchors[i];
      anchor.removeAttribute("class");
      for (j in attributes) {
        anchor.setAttribute(j, attributes[j]);
      }
    }
    
    elementToSetCaretAfter = anchor;
    if (length === 1) {
      textContent = wysihtml5.utils.getTextContent(anchor);
      hasElementChild = !!anchor.querySelector("*");
      isEmpty = textContent === "" || textContent === "\uFEFF";
      if (!hasElementChild && isEmpty) {
        wysihtml5.utils.setTextContent(anchor, anchor.href);
        whiteSpace = doc.createTextNode(" ");
        wysihtml5.utils.caret.setAfter(anchor);
        wysihtml5.utils.caret.insertNode(whiteSpace);
        elementToSetCaretAfter = whiteSpace;
      }
    }
    wysihtml5.utils.caret.setAfter(elementToSetCaretAfter);
  }
  
  /**
   * TODO: Use cssapplier or formatInline here
   *
   * Turns selection into a link
   * If selection is already a link, it removes the link and wraps it with a <code> element
   * The <code> element is needed to avoid auto linking
   * 
   * @example
   *    // either ...
   *    wysihtml5.commands.createLink.exec(element, "createLink", "http://www.google.de");
   *    // ... or ...
   *    wysihtml5.commands.createLink.exec(element, "createLink", { href: "http://www.google.de", target: "_blank" });
   */
  function exec(element, command, value) {
    var doc           = element.ownerDocument,
        anchors       = state(element, command);
    
    if (anchors) {
      // Selection contains links
      wysihtml5.utils.caret.executeAndRestore(doc, function() {
        _removeFormat(element, anchors);
      });
    } else {
      // Create links
      value = typeof(value) === "object" ? value : { href: value };
      _format(element, value);
    }
  }
  
  function state(element, command) {
    return wysihtml5.commands.formatInline.state(element, command, "A");
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