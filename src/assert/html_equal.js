var wysihtml5 = wysihtml5 || {};
wysihtml5.assert = wysihtml5.assert || {};

/**
 * Compare html strings without stumbling upon browser misbehaviors
 * Uses and takes the same parameters as QUnit's equal method
 *
 * @example
 *    wysihtml5.assert.htmlEqual(
 *      removeAttributes('<p align="center">foo</p>'),
 *      '<p>foo</p>',
 *      'Removed align attribute on <p>'
 *    );
 */
wysihtml5.assert.htmlEqual = (function() {
  var htmlHost = document.createElement("div");
  
  /**
   * IE uppercases tags and attribute names
   * and also removes quotes around attribute values whenever possible
   */
  var NEEDS_TO_BE_PREPARSED = (function() {
    var html = '<img alt="foo" width=1 height="1" data-foo="1">';
    htmlHost.innerHTML = html;
    return htmlHost.innerHTML != html;
  })();
  
  var DOESNT_PRESERVE_WHITE_SPACE = (function() {
    var div  = document.createElement("div"),
        a    = document.createElement("a"),
        p    = document.createElement("p");
    a.appendChild(p);
    div.appendChild(a);
    return div.innerHTML.toLowerCase() != "<a><p></p></a>";
  })();
  
  /**
   * When setting attributes via DOM API (setAttribute, etc.)
   * Firefox reorders them randomly when read via innerHTML, which makes comparing such strings
   * with expected strings a pain in the arse
   * Issue: https://bugzilla.mozilla.org/show_bug.cgi?id=238686
   */
  var REORDERS_ATTRIBUTES = (function() {
    var img = document.createElement("img"),
        parsedActualHtml,
        parsedExpectedHtml;
    img.setAttribute("alt", "foo");
    img.setAttribute("border", "1");
    img.setAttribute("src", "foo.gif");
    htmlHost.innerHTML = "";
    htmlHost.appendChild(img);
    parsedActualHtml = htmlHost.innerHTML;
    htmlHost.innerHTML = '<img alt="foo" border="1" src="foo.gif">';
    parsedExpectedHtml = htmlHost.innerHTML;
    return parsedExpectedHtml != parsedActualHtml;
  })();
  
  /**
   * Browsers don't preserve original attribute order
   * In order to be able to compare html we simply split both, the expected and actual html at spaces and element-ends,
   * sort them alphabetically and put them back together
   * TODO: This solution is a bit crappy. Maybe there's a smarter way. However it works for now.
   */
  var tokenizeHTML = (function() {
    var REG_EXP = /\s+|\>|</;
    return function(html) {
      return html.split(REG_EXP).sort().join(" ");
    };
  })();
  
  var normalizeWhiteSpace = (function() {
    var PRE_REG_EXP         = /(<pre[\^>]*>)([\S\s]*?)(<\/pre>)/mgi,
        WHITE_SPACE_REG_EXP = /\s+/gm,
        PLACEHOLDER         = "___PRE_CONTENT___",
        PLACEHOLDER_REG_EXP = new RegExp(PLACEHOLDER, "g");
    return function(html) {
      var preContents = [];
      // Extract content of elements that preserve white space first
      html = html.replace(PRE_REG_EXP, function(match, $1, $2, $3) {
        preContents.push($2);
        return $1 + PLACEHOLDER + $3;
      });
      
      // Normalize space
      html = html.replace(WHITE_SPACE_REG_EXP, " ");
      
      // Reinsert original pre content
      html = html.replace(PLACEHOLDER_REG_EXP, function() {
        return preContents.shift();
      });
      
      return html;
    };
  })();
  
  var removeWhiteSpace = (function() {
    var REG_EXP = /(>)(\s*?)(<)/gm;
    return function(html) {
      return wysihtml5.lang.string(html.replace(REG_EXP, "$1$3")).trim();
    };
  })();
  
  return function(actual, expected, message, config) {
    config = config || {};
    if (NEEDS_TO_BE_PREPARSED) {
      actual = wysihtml5.dom.getAsDom(actual).innerHTML;
      expected = wysihtml5.dom.getAsDom(expected).innerHTML;
    }
    
    if (config.normalizeWhiteSpace || DOESNT_PRESERVE_WHITE_SPACE) {
      actual = normalizeWhiteSpace(actual);
      expected = normalizeWhiteSpace(expected);
    }
    
    if (config.removeWhiteSpace) {
      actual = removeWhiteSpace(actual);
      expected = removeWhiteSpace(expected);
    }
    
    actual = tokenizeHTML(actual);
    expected = tokenizeHTML(expected);
    ok(actual == expected, message);
  };
})();