/**
 * Insert CSS rules
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Array} rules An array containing the css rules to insert
 *
 * @example
 *    wysihtml5.utils.insertRules([
 *      "html { height: 100%; }",
 *      "body { color: red; }"
 *    ]).into(document);
 */
wysihtml5.utils.insertRules = function(rules) {
  rules = rules.join("\n");
  
  return {
    into: function(doc) {
      var head         = doc.head || doc.getElementsByTagName("head")[0],
          styleElement = doc.createElement("style");
      
      styleElement.type = "text/css";
      
      if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = rules;
      } else {
        styleElement.appendChild(doc.createTextNode(rules));
      }
      
      if (head) {
        head.appendChild(styleElement);
      }
    }
  };
};