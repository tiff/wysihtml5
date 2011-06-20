wysihtml5.utils.contains = (function() {
  var documentElement = document.documentElement;
  if (documentElement.contains) {
    return function(container, element) {
      if (element.nodeType !== Node.ELEMENT_NODE) {
        element = element.parentNode;
      }
      return container !== element && container.contains(element);
    };
  } else if (documentElement.compareDocumentPosition) {
    return function(container, element) {
      // https://developer.mozilla.org/en/DOM/Node.compareDocumentPosition
      return !!(container.compareDocumentPosition(element) & 16);
    };
  }
})();