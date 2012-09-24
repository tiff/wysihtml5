module("wysihtml5.dom.resolveList", {
  equal: function(actual, expected, message) {
    return wysihtml5.assert.htmlEqual(actual, expected, message);
  },
  
  resolveList: function(html, useLineBreaks) {
    var container = wysihtml5.dom.getAsDom(html);
    document.body.appendChild(container);
    wysihtml5.dom.resolveList(container.firstChild, useLineBreaks);
    var innerHTML = container.innerHTML;
    container.parentNode.removeChild(container);
    return innerHTML;
  }
});

test("Basic tests (useLineBreaks = true)", function() {
  this.equal(
    this.resolveList("<ul><li>foo</li></ul>", true),
    "foo<br>"
  );
  
  this.equal(
    this.resolveList("<ul><li>foo</li><li>bar</li></ul>", true),
    "foo<br>bar<br>"
  );
  
  this.equal(
    this.resolveList("<ol><li>foo</li><li>bar</li></ol>", true),
    "foo<br>bar<br>"
  );
  
  this.equal(
    this.resolveList("<ol><li></li><li>bar</li></ol>", true),
    "bar<br>"
  );
  
  this.equal(
    this.resolveList("<ol><li>foo<br></li><li>bar</li></ol>", true),
    "foo<br>bar<br>"
  );
  
  this.equal(
    this.resolveList("<ul><li><h1>foo</h1></li><li><div>bar</div></li><li>baz</li></ul>", true),
    "<h1>foo</h1><div>bar</div>baz<br>"
  );
});

test("Basic tests (useLineBreaks = false)", function() {
  this.equal(
    this.resolveList("<ul><li>foo</li></ul>"),
    "<p>foo</p>"
  );
  
  this.equal(
    this.resolveList("<ul><li>foo</li><li>bar</li></ul>"),
    "<p>foo</p><p>bar</p>"
  );
  
  this.equal(
    this.resolveList("<ol><li>foo</li><li>bar</li></ol>"),
    "<p>foo</p><p>bar</p>"
  );
  
  this.equal(
    this.resolveList("<ol><li></li><li>bar</li></ol>"),
    "<p></p><p>bar</p>"
  );
  
  this.equal(
    this.resolveList("<ol><li>foo<br></li><li>bar</li></ol>"),
    "<p>foo<br></p><p>bar</p>"
  );
  
  this.equal(
    this.resolveList("<ul><li><h1>foo</h1></li><li><div>bar</div></li><li>baz</li></ul>"),
    "<h1>foo</h1><div>bar</div><p>baz</p>"
  );
});