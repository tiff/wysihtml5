module("wysihtml5.utils.convertIntoList", {
  equals: function(actual, expected, message) {
    return wysihtml5.assert.htmlEquals(actual, expected, message);
  },
  
  convertIntoList: function(html, type) {
    var container = wysihtml5.utils.getInDomElement(html);
    document.body.appendChild(container);
    this.elements.push(container);
    wysihtml5.utils.convertIntoList(container.firstChild, type);
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

test("Basic tests for UL", function() {
  this.equals(
    this.convertIntoList("<div>foo</div>", "ul"),
    "<ul><li>foo</li></ul>"
  );
  
  this.equals(
    this.convertIntoList("<span></span>", "ul"),
    "<ul></ul>"
  );
  
  this.equals(
    this.convertIntoList("<span>foo<br>bar</span>", "ul"),
    "<ul><li>foo</li><li>bar</li></ul>"
  );
  
  this.equals(
    this.convertIntoList("<span>foo<br>bar<div>baz</div></span>", "ul"),
    "<ul><li>foo</li><li>bar</li><li><div>baz</div></li></ul>"
  );
  
  this.equals(
    this.convertIntoList("<span><div></div><h1></h1><p>yeah</p></span>", "ul"),
    "<ul><li><div></div></li><li><h1></h1></li><li><p>yeah</p></li></ul>"
  );
});

test("Basic tests for OL", function() {
  this.equals(
    this.convertIntoList("<div>foo</div>", "ol"),
    "<ol><li>foo</li></ol>"
  );
  
  this.equals(
    this.convertIntoList("<span></span>", "ol"),
    "<ol></ol>"
  );
  
  this.equals(
    this.convertIntoList("<span>foo<br>bar</span>", "ol"),
    "<ol><li>foo</li><li>bar</li></ol>"
  );
  
  this.equals(
    this.convertIntoList("<span>foo<br>bar<div>baz</div></span>", "ol"),
    "<ol><li>foo</li><li>bar</li><li><div>baz</div></li></ol>"
  );
  
  this.equals(
    this.convertIntoList("<span><div></div><h1></h1><p>yeah</p></span>", "ol"),
    "<ol><li><div></div></li><li><h1></h1></li><li><p>yeah</p></li></ol>"
  );
});


test("Test whether it doesn't convert dom trees that are already a list", function() {
  this.equals(
    this.convertIntoList("<ol><li>foo</li></ol>", "ol"),
    "<ol><li>foo</li></ol>"
  );
  
  this.equals(
    this.convertIntoList("<menu><li>foo</li></menu>", "ol"),
    "<menu><li>foo</li></menu>"
  );
  
  this.equals(
    this.convertIntoList("<ul><li>foo</li></ul>", "ol"),
    "<ul><li>foo</li></ul>"
  );
});