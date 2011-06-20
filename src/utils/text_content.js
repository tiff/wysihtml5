if ("textContent" in document.documentElement) {
  wysihtml5.utils.setTextContent = function(element, text) {
    element.textContent = text;
  };
  
  wysihtml5.utils.getTextContent = function(element) {
    return element.textContent;
  };
} else if ("innerText" in document.documentElement) {
  wysihtml5.utils.setTextContent = function(element, text) {
    element.innerText = text;
  };

  wysihtml5.utils.getTextContent = function(element) {
    return element.innerText;
  };
} else {
  wysihtml5.utils.setTextContent = function(element, text) {
    element.nodeValue = text;
  };
  
  wysihtml5.utils.getTextContent = function(element) {
    return element.nodeValue;
  };
}
