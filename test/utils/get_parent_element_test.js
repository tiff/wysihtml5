module("wysihtml5.utils.getParentElement", {
  setup: function() {
    this.container = new Element("div");
  }
});


test("Basic test - nodeName only", function() {
  this.container.innerHTML = "<ul><li>foo</li></ul>";
  
  var listItem = this.container.down("li"),
      textNode = listItem.firstChild,
      list     = this.container.down("ul");
  equals(wysihtml5.utils.getParentElement(listItem, { nodeName: "LI" }), listItem);
  equals(wysihtml5.utils.getParentElement(listItem, { nodeName: ["LI", "UL"] }), listItem);
  equals(wysihtml5.utils.getParentElement(listItem, { nodeName: "UL" }), list);
  equals(wysihtml5.utils.getParentElement(textNode, { nodeName: "UL" }), list);
  equals(wysihtml5.utils.getParentElement(listItem, { nodeName: "ul" }), null);
  equals(wysihtml5.utils.getParentElement(listItem, { nodeName: "SPAN" }), null);
});


test("Check 'levels' param - nodeName only", function() {
  this.container.innerHTML = "<div><div><ul><li></li></ul></blockquote></div></div>";
  
  var listItem  = this.container.down("li"),
      nestedDiv = this.container.down("div div");
  equals(wysihtml5.utils.getParentElement(listItem, { nodeName: "DIV" }, 2), null);
  equals(wysihtml5.utils.getParentElement(listItem, { nodeName: "DIV" }, 3), nestedDiv);
});


test("Basic test - nodeName + className", function() {
  this.container.innerHTML = '<span class="wysiwyg-color-red wysiwyg-color-green">foo</span>';
  
  var spanElement = this.container.firstChild,
      textNode    = this.container.firstChild.firstChild,
      result;
  
  result = wysihtml5.utils.getParentElement(textNode, {
    nodeName:   "SPAN",
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equals(result, spanElement);
  
  result = wysihtml5.utils.getParentElement(textNode, {
    nodeName:   ["STRONG", "SPAN"],
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equals(result, spanElement);
  
  result = wysihtml5.utils.getParentElement(textNode, {
    nodeName:   ["STRONG"],
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equals(result, null);
  
  result = wysihtml5.utils.getParentElement(textNode, {
    nodeName:   "DIV",
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equals(result, null);
  
  result = wysihtml5.utils.getParentElement(textNode, {
    nodeName:   "SPAN",
    className:  "wysiwyg-color-blue",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equals(result, null);
  
  result = wysihtml5.utils.getParentElement(textNode, {
    nodeName:   "SPAN",
    className:  "wysiwyg-color-red",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equals(result, null);
  
  result = wysihtml5.utils.getParentElement(spanElement, {
    nodeName:   "SPAN",
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equals(result, spanElement);
  
  result = wysihtml5.utils.getParentElement(spanElement, {
    nodeName:   "span",
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equals(result, null);
});


test("Check 'levels' param - nodeName + className", function() {
  this.container.innerHTML = '<div class="wysiwyg-color-green"><div class="wysiwyg-color-green"><ul><li></li></ul></blockquote></div></div>';
  
  var listItem  = this.container.down("li"),
      nestedDiv = this.container.down("div div"),
      result;
  
  result = wysihtml5.utils.getParentElement(listItem, {
    nodeName:     "DIV",
    className:    "wysiwyg-color-green",
    classRegExp:  /wysiwyg-color-[a-z]+/g
  }, 2);
  equals(result, null);
  
  result = wysihtml5.utils.getParentElement(listItem, {
    nodeName:     "DIV",
    className:    "wysiwyg-color-green",
    classRegExp:  /wysiwyg-color-[a-z]+/g
  }, 3);
  equals(result, nestedDiv);
});


test("Check  - no nodeName", function() {
  this.container.innerHTML = '<div><div class="wysiwyg-text-align-right"><span>foo</span></div></div>';
  
  var spanElement = this.container.down("span"),
      alignedDiv  = this.container.down("div div"),
      result;
  
  result = wysihtml5.utils.getParentElement(spanElement, {
    className:    "wysiwyg-text-align-right",
    classRegExp:  /wysiwyg-text-align-[a-z]+/g
  });
  equals(result, alignedDiv);
});

test("Test - with no nodeName", function() {
  this.container.innerHTML = '<div><div class="wysiwyg-text-align-right"><span>foo</span></div></div>';
  
  var spanElement = this.container.down("span"),
      alignedDiv  = this.container.down("div div"),
      result;
  
  result = wysihtml5.utils.getParentElement(spanElement, {
    className:    "wysiwyg-text-align-right",
    classRegExp:  /wysiwyg-text-align-[a-z]+/g
  });
  equals(result, alignedDiv);
});

test("Test - with only a classRegExp", function() {
  this.container.innerHTML = '<div><div class="wysiwyg-text-align-right"><span>foo</span></div></div>';
  
  var spanElement = this.container.down("span"),
      alignedDiv  = this.container.down("div div"),
      result;
  
  result = wysihtml5.utils.getParentElement(spanElement, {
    classRegExp:  /wysiwyg-text-align-[a-z]+/g
  });
  equals(result, alignedDiv);
});