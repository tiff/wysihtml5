module("wysihtml5.dom.resolveList", {
  equal: function(actual, expected, message) {
    return wysihtml5.assert.htmlEqual(actual, expected, message);
  },
  
  resolveList: function(html) {
    var container = wysihtml5.dom.getAsDom(html);
    document.body.appendChild(container);
    wysihtml5.dom.resolveList(container.firstChild);
    var innerHTML = container.innerHTML;
    container.parentNode.removeChild(container);
    return innerHTML;
  }
});

test("Basic tests", function() {
  this.equal(
    this.resolveList("<ul><li>foo</li></ul>"),
    "foo<br>"
  );
  
  this.equal(
    this.resolveList("<ul><li>foo</li><li>bar</li></ul>"),
    "foo<br>bar<br>"
  );
  
  this.equal(
    this.resolveList("<ol><li>foo</li><li>bar</li></ol>"),
    "foo<br>bar<br>"
  );
  
  this.equal(
    this.resolveList("<ol><li></li><li>bar</li></ol>"),
    "bar<br>"
  );
  
  this.equal(
    this.resolveList("<ol><li>foo<br></li><li>bar</li></ol>"),
    "foo<br>bar<br>"
  );
  
  this.equal(
    this.resolveList("<ul><li><h1>foo</h1></li><li><div>bar</div></li><li>baz</li></ul>"),
    "<h1>foo</h1><div>bar</div>baz<br>"
  );
});
