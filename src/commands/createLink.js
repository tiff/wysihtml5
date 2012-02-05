(function(wysihtml5) {
  var undef,
      NODE_NAME = "A",
      dom       = wysihtml5.dom;
  
  function _removeFormat(element, anchors) {
    var length = anchors.length,
        i      = 0,
        anchor,
        codeElement,
        textContent;
    for (; i<length; i++) {
      anchor      = anchors[i];
      codeElement = dom.getParentElement(anchor, { nodeName: "code" });
      textContent = dom.getTextContent(anchor);

      // if <a> contains url-like text content, rename it to <code> to prevent re-autolinking
      // else replace <a> with its childNodes
      if (textContent.match(dom.autoLink.URL_REG_EXP) && !codeElement) {
        // <code> element is used to prevent later auto-linking of the content
        codeElement = dom.renameElement(anchor, "code");
      } else {
        dom.replaceWithChildNodes(anchor);
      }
    }
  }

  function _format(element, attributes) {
    var doc             = element.ownerDocument,
        tempClass       = "_wysihtml5-temp-" + (+new Date()),
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
      textContent = dom.getTextContent(anchor);
      hasElementChild = !!anchor.querySelector("*");
      isEmpty = textContent === "" || textContent === wysihtml5.INVISIBLE_SPACE;
      if (!hasElementChild && isEmpty) {
        dom.setTextContent(anchor, anchor.href);
        whiteSpace = doc.createTextNode(" ");
        wysihtml5.selection.setAfter(anchor);
        wysihtml5.selection.insertNode(whiteSpace);
        elementToSetCaretAfter = whiteSpace;
      }
    }
    wysihtml5.selection.setAfter(elementToSetCaretAfter);
  }
  
  wysihtml5.commands.createLink = {
    /**
     * TODO: Use HTMLApplier or formatInline here
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
    exec: function(element, command, value) {
      var doc           = element.ownerDocument,
          anchors       = this.state(element, command);

      if (anchors) {
        // Selection contains links
        wysihtml5.selection.executeAndRestore(function() {
          _removeFormat(element, anchors);
        });
      } else {
        // Create links
        value = typeof(value) === "object" ? value : { href: value };
        _format(element, value);
      }
    },

    state: function(element, command) {
      return wysihtml5.commands.formatInline.state(element, command, "A");
    },

    value: function() {
      return undef;
    }
  };
})(wysihtml5);