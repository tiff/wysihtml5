module("wysihtml5.dom.autoLink", {
  equal: function(actual, expected, message) {
    return wysihtml5.assert.htmlEqual(actual, expected, message);
  },
  
  autoLink: function(html) {
    var container = wysihtml5.dom.getAsDom(html);
    return wysihtml5.dom.autoLink(container).innerHTML;
  } 
});


test("Basic test", function() {
  ok(wysihtml5.dom.autoLink.URL_REG_EXP, "URL reg exp is revealed to be access globally");
  
  this.equal(
    this.autoLink("hey check out this search engine http://www.google.com"),
    "hey check out this search engine <a href=\"http://www.google.com\">http://www.google.com</a>",
    "Urls starting with http:// are correctly linked"
  );
  
  this.equal(
    this.autoLink("hey check out this search engine https://www.google.com"),
    "hey check out this search engine <a href=\"https://www.google.com\">https://www.google.com</a>",
    "Urls starting with https:// are correctly linked"
  );
  
  this.equal(
    this.autoLink("hey check out this search engine www.google.com"),
    "hey check out this search engine <a href=\"http://www.google.com\">www.google.com</a>",
    "Urls starting with www. are correctly linked"
  );
  
  this.equal(
    this.autoLink("hey check out this mail christopher.blum@xing.com"),
    "hey check out this mail christopher.blum@xing.com",
    "E-Mails are not linked"
  );
  
  this.equal(
    this.autoLink("http://google.de"),
    "<a href=\"http://google.de\">http://google.de</a>",
    "Single url without www. but with http:// is auto linked"
  );
  
  this.equal(
    this.autoLink("hey check out this search engine <a href=\"http://www.google.com\">www.google.com</a>"),
    "hey check out this search engine <a href=\"http://www.google.com\">www.google.com</a>",
    "Already auto-linked stuff isn't causing a relinking"
  );
  
  this.equal(
    this.autoLink("hey check out this search engine <code><span>http://www.google.com</span></code>"),
    "hey check out this search engine <code><span>http://www.google.com</span></code>",
    "Urls inside 'code' elements are not auto linked"
  );
  
  this.equal(
    this.autoLink("hey check out this search engine <pre>http://www.google.com</pre>"),
    "hey check out this search engine <pre>http://www.google.com</pre>",
    "Urls inside 'pre' elements are not auto linked"
  );
  
  this.equal(
    this.autoLink("hey check out this search engine (http://www.google.com)"),
    "hey check out this search engine (<a href=\"http://www.google.com\">http://www.google.com</a>)",
    "Parenthesis around url are not part of url #1"
  );
  
  this.equal(
    this.autoLink("hey check out this search engine (http://www.google.com?q=hello(spencer))"),
    "hey check out this search engine (<a href=\"http://www.google.com?q=hello(spencer)\">http://www.google.com?q=hello(spencer)</a>)",
    "Parenthesis around url are not part of url #2"
  );
  
  this.equal(
    this.autoLink("hey check out this search engine <span>http://www.google.com?q=hello(spencer)</span>"),
    "hey check out this search engine <span><a href=\"http://www.google.com?q=hello(spencer)\">http://www.google.com?q=hello(spencer)</a></span>",
    "Urls in tags are correctly auto linked"
  );
  
  this.equal(
    this.autoLink("http://google.de and http://yahoo.com as well as <span>http://de.finance.yahoo.com</span> <a href=\"http://google.com\" class=\"more\">http://google.com</a>"),
    "<a href=\"http://google.de\">http://google.de</a> and <a href=\"http://yahoo.com\">http://yahoo.com</a> as well as <span><a href=\"http://de.finance.yahoo.com\">http://de.finance.yahoo.com</a></span> <a href=\"http://google.com\" class=\"more\">http://google.com</a>",
    "Multiple urls are correctly auto linked"
  );
  
  this.equal(
    this.autoLink("<script>http://google.de</script>"),
    "<script>http://google.de</script>",
    "Urls in SCRIPT elements are not touched"
  );
  
  this.equal(
    this.autoLink("<script>http://google.de</script>"),
    "<script>http://google.de</script>",
    "Urls in SCRIPT elements are not touched"
  );
  
  this.equal(
    this.autoLink(" http://www.google.de"),
    " <a href=\"http://www.google.de\">http://www.google.de</a>",
    "Check if white space in front of url is preserved"
  );
});