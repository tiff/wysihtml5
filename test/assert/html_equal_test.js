module("wysihtml5.assert.htmlEqual");

test("Basic tests", function() {
  wysihtml5.assert.htmlEqual("<span>foo</span>", "<span>foo</span>");
  wysihtml5.assert.htmlEqual("<SPAN>foo</SPAN>", "<span>foo</span>");
  wysihtml5.assert.htmlEqual("<IMG SRC=foo.gif>", '<img src="foo.gif">');
  
  var container = document.createElement("div"),
      image     = document.createElement("img");
  image.setAttribute("alt", "foo");
  image.setAttribute("border", 0);
  image.setAttribute("src", "foo.gif");
  image.setAttribute("width", 25);
  image.setAttribute("height", 25);
  container.appendChild(image);
  
  wysihtml5.assert.htmlEqual(container.innerHTML, '<img alt="foo" border="0" src="foo.gif" width="25" height="25">');
  
  var inlineElement = document.createElement("span");
  inlineElement.innerHTML = "<p>foo</p>";
  container.innerHTML = "";
  container.appendChild(inlineElement);
  wysihtml5.assert.htmlEqual(container.innerHTML, '<span><p>foo</p></span>');
  
  wysihtml5.assert.htmlEqual("<p>foo     bar</p>", '<p>foo bar</p>', "", {
    normalizeWhiteSpace: true
  });
  
  wysihtml5.assert.htmlEqual("<div><pre><p>foo  bar</p></pre></div>", '<div><pre><p>foo  bar</p></pre></div>', "", {
    normalizeWhiteSpace: true
  });
});