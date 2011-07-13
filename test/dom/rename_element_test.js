module("wysihtml5.dom.renameElement", {
  equals: function(actual, expected, message) {
    return wysihtml5.assert.htmlEquals(actual, expected, message);
  },
  
  renameElement: function(html, newNodeName) {
    var container = wysihtml5.dom.getAsDom(html);
    wysihtml5.dom.renameElement(container.firstChild, newNodeName);
    return container.innerHTML;
  }
});

test("Basic tests", function() {
  this.equals(
    this.renameElement("<p>foo</p>", "div"),
    "<div>foo</div>"
  );
  
  this.equals(
    this.renameElement("<ul><li>foo</li></ul>", "ol"),
    "<ol><li>foo</li></ol>"
  );
  
  this.equals(
    this.renameElement('<p align="left" class="foo"></p>', "h2"),
    '<h2 align="left" class="foo"></h2>'
  );
});