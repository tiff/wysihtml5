(function(wysihtml5) {
  var NODE_NAME = "IMG";
  
  wysihtml5.commands.insertImage = {
    /**
     * Inserts an <img>
     * If selection is already an image link, it removes it
     * 
     * @example
     *    // either ...
     *    wysihtml5.commands.insertImage.exec(element, "insertImage", "http://www.google.de/logo.jpg");
     *    // ... or ...
     *    wysihtml5.commands.insertImage.exec(element, "insertImage", { src: "http://www.google.de/logo.jpg", title: "foo" });
     */
    exec: function(element, command, value) {
      value = typeof(value) === "object" ? value : { src: value };

      var doc   = element.ownerDocument,
          image = this.state(element),
          i,
          parent;

      if (image) {
        // Image already selected, set the caret before it and delete it
        wysihtml5.selection.setBefore(image);
        parent = image.parentNode;
        parent.removeChild(image);

        // and it's parent <a> too if it hasn't got any other relevant child nodes
        wysihtml5.dom.removeEmptyTextNodes(parent);
        if (parent.nodeName === "A" && !parent.firstChild) {
          wysihtml5.selection.setAfter(parent);
          parent.parentNode.removeChild(parent);
        }

        // firefox and ie sometimes don't remove the image handles, even though the image got removed
        wysihtml5.quirks.redraw(element);
        return;
      }

      image = doc.createElement(NODE_NAME);

      for (i in value) {
        image[i] = value[i];
      }

      wysihtml5.selection.insertNode(image);
      wysihtml5.selection.setAfter(image);
    },

    state: function(element) {
      var doc = element.ownerDocument,
          selectedNode,
          text,
          imagesInSelection;

      if (!wysihtml5.dom.hasElementWithTagName(doc, NODE_NAME)) {
        return false;
      }

      selectedNode = wysihtml5.selection.getSelectedNode();
      if (!selectedNode) {
        return false;
      }

      if (selectedNode.nodeName === NODE_NAME) {
        // This works perfectly in IE
        return selectedNode;
      }

      if (selectedNode.nodeType !== wysihtml5.ELEMENT_NODE) {
        return false;
      }

      text = wysihtml5.selection.getText();
      text = wysihtml5.lang.string(text).trim();
      if (text) {
        return false;
      }

      imagesInSelection = wysihtml5.selection.getNodes(wysihtml5.ELEMENT_NODE, function(node) {
        return node.nodeName === "IMG";
      });

      if (imagesInSelection.length !== 1) {
        return false;
      }

      return imagesInSelection[0];
    },

    value: function(element) {
      var image = this.state(element);
      return image && image.src;
    }
  };
})(wysihtml5);