/**
 * Checks for empty text node childs and removes them
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} node The element in which to cleanup
 * @example
 *    wysihtml5.utils.removeEmptyTextNodes(element);
 */
wysihtml5.utils.removeEmptyTextNodes = function(node) {
  var childNode,
      childNodes        = $A(node.childNodes), // $A needed since childNodes is not an array but a live NodeList
      childNodesLength  = childNodes.length,
      i                 = 0;
  for (; i<childNodesLength; i++) {
    childNode = childNodes[i];
    if (childNode.nodeType === Node.TEXT_NODE && childNode.data === "") {
      childNode.parentNode.removeChild(childNode);
    }
  }
};
