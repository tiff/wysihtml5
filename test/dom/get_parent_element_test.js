module("wysihtml5.dom.getParentElement", {
  setup: function() {
    this.container = document.createElement("div");
  }
});


test("Basic test - nodeName only", function() {
  this.container.innerHTML = "<ul><li>foo</li></ul>";
  
  var listItem = this.container.querySelector("li"),
      textNode = listItem.firstChild,
      list     = this.container.querySelector("ul");
  equal(wysihtml5.dom.getParentElement(listItem, { nodeName: "LI" }), listItem);
  equal(wysihtml5.dom.getParentElement(listItem, { nodeName: ["LI", "UL"] }), listItem);
  equal(wysihtml5.dom.getParentElement(listItem, { nodeName: "UL" }), list);
  equal(wysihtml5.dom.getParentElement(textNode, { nodeName: "UL" }), list);
  equal(wysihtml5.dom.getParentElement(listItem, { nodeName: "ul" }), null);
  equal(wysihtml5.dom.getParentElement(listItem, { nodeName: "SPAN" }), null);
});


test("Check 'levels' param - nodeName only", function() {
  this.container.innerHTML = "<div><div><ul><li></li></ul></div></div>";
  
  var listItem  = this.container.querySelector("li"),
      nestedDiv = this.container.querySelector("div").querySelector("div");
  equal(wysihtml5.dom.getParentElement(listItem, { nodeName: "DIV" }, 2), null);
  equal(wysihtml5.dom.getParentElement(listItem, { nodeName: "DIV" }, 3), nestedDiv);
  
});


test("Basic test - nodeName + className", function() {
  this.container.innerHTML = '<span class="wysiwyg-color-red wysiwyg-color-green">foo</span>';
  
  var spanElement = this.container.firstChild,
      textNode    = this.container.firstChild.firstChild,
      result;
  
  result = wysihtml5.dom.getParentElement(textNode, {
    nodeName:   "SPAN",
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equal(result, spanElement);
  
  result = wysihtml5.dom.getParentElement(textNode, {
    nodeName:   ["STRONG", "SPAN"],
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equal(result, spanElement);
  
  result = wysihtml5.dom.getParentElement(textNode, {
    nodeName:   ["STRONG"],
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equal(result, null);
  
  result = wysihtml5.dom.getParentElement(textNode, {
    nodeName:   "DIV",
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equal(result, null);
  
  result = wysihtml5.dom.getParentElement(textNode, {
    nodeName:   "SPAN",
    className:  "wysiwyg-color-blue",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equal(result, null);
  
  result = wysihtml5.dom.getParentElement(textNode, {
    nodeName:   "SPAN",
    className:  "wysiwyg-color-red",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equal(result, null);
  
  result = wysihtml5.dom.getParentElement(spanElement, {
    nodeName:   "SPAN",
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equal(result, spanElement);
  
  result = wysihtml5.dom.getParentElement(spanElement, {
    nodeName:   "span",
    className:  "wysiwyg-color-green",
    classRegExp: /wysiwyg-color-[a-z]+/g
  });
  equal(result, null);
});


test("Check 'levels' param - nodeName + className", function() {
  this.container.innerHTML = '<div class="wysiwyg-color-green"><div class="wysiwyg-color-green"><ul><li></li></ul></blockquote></div></div>';
  
  var listItem  = this.container.querySelector("li"),
      nestedDiv = this.container.querySelector("div").querySelector("div"),
      result;
  
  result = wysihtml5.dom.getParentElement(listItem, {
    nodeName:     "DIV",
    className:    "wysiwyg-color-green",
    classRegExp:  /wysiwyg-color-[a-z]+/g
  }, 2);
  equal(result, null);
  
  result = wysihtml5.dom.getParentElement(listItem, {
    nodeName:     "DIV",
    className:    "wysiwyg-color-green",
    classRegExp:  /wysiwyg-color-[a-z]+/g
  }, 3);
  equal(result, nestedDiv);
});


test("Check  - no nodeName", function() {
  this.container.innerHTML = '<div><div class="wysiwyg-text-align-right"><span>foo</span></div></div>';
  
  var spanElement = this.container.querySelector("span"),
      alignedDiv  = this.container.querySelector("div").querySelector("div"),
      result;
  
  result = wysihtml5.dom.getParentElement(spanElement, {
    className:    "wysiwyg-text-align-right",
    classRegExp:  /wysiwyg-text-align-[a-z]+/g
  });
  equal(result, alignedDiv);
});

test("Test - with no nodeName", function() {
  this.container.innerHTML = '<div><div class="wysiwyg-text-align-right"><span>foo</span></div></div>';
  
  var spanElement = this.container.querySelector("span"),
      alignedDiv  = this.container.querySelector("div").querySelector("div"),
      result;
  
  result = wysihtml5.dom.getParentElement(spanElement, {
    className:    "wysiwyg-text-align-right",
    classRegExp:  /wysiwyg-text-align-[a-z]+/g
  });
  equal(result, alignedDiv);
});

test("Test - with only a classRegExp", function() {
  this.container.innerHTML = '<div><div class="wysiwyg-text-align-right"><span>foo</span></div></div>';
  
  var spanElement = this.container.querySelector("span"),
      alignedDiv  = this.container.querySelector("div").querySelector("div"),
      result;
  
  result = wysihtml5.dom.getParentElement(spanElement, {
    classRegExp:  /wysiwyg-text-align-[a-z]+/g
  });
  equal(result, alignedDiv);
});