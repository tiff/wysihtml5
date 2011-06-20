/**
 * High performant way to check whether an element with a specific class name is in the given document
 * Optimized for being heavily executed
 * Unleashes the power of live node lists
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Object} doc The document object of the context where to check
 * @param {String} tagName Upper cased tag name
 * @example
 *    wysihtml5.utils.hasElementWithClassName(document, "foobar");
 */
wysihtml5.utils.hasElementWithClassName = (function() {
  var LIVE_CACHE          = {},
      DOCUMENT_IDENTIFIER = 1;
  
  function _getDocumentIdentifier(doc) {
    return doc._wysihtml5Identifier || (doc._wysihtml5Identifier = DOCUMENT_IDENTIFIER++);
  }
  
  return function(doc, className) {
    // getElementsByClassName is not supported by IE<9
    // but is sometimes mocked via library code (which then doesn't return live node lists)
    if (!wysihtml5.browserSupports.getElementsByClassName()) {
      return !!doc.querySelector("." + className);
    }
    
    var key         = _getDocumentIdentifier(doc) + ":" + className,
        cacheEntry  = LIVE_CACHE[key];
    if (!cacheEntry) {
      cacheEntry = LIVE_CACHE[key] = doc.getElementsByClassName(className);
    }
    
    return cacheEntry.length > 0;
  };
})();