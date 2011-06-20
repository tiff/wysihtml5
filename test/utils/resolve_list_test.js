module("wysihtml5.utils.resolveList", {
  equals: function(actual, expected, message) {
    return wysihtml5.assert.htmlEquals(actual, expected, message);
  },
  
  resolveList: function(html) {
    var container = wysihtml5.utils.getInDomElement(html);
    document.body.appendChild(container);
    this.elements.push(container);
    wysihtml5.utils.resolveList(container.firstChild);
    return container.innerHTML;
  },
  
  setup: function() {
    this.elements = [];
  },
  
  teardown: function() {
    this.elements.each(function(element) {
      Element.remove(element);
    });
  }
});

test("Basic tests", function() {
  this.equals(
    this.resolveList("<ul><li>foo</li></ul>"),
    "foo<br>"
  );
  
  this.equals(
    this.resolveList("<ul><li>foo</li><li>bar</li></ul>"),
    "foo<br>bar<br>"
  );
  
  this.equals(
    this.resolveList("<ol><li>foo</li><li>bar</li></ol>"),
    "foo<br>bar<br>"
  );
  
  this.equals(
    this.resolveList("<ol><li></li><li>bar</li></ol>"),
    "bar<br>"
  );
  
  this.equals(
    this.resolveList("<ol><li>foo<br></li><li>bar</li></ol>"),
    "foo<br>bar<br>"
  );
  
  this.equals(
    this.resolveList("<ul><li><h1>foo</h1></li><li><div>bar</div></li><li>baz</li></ul>"),
    "<h1>foo</h1><div>bar</div>baz<br>"
  );
});
