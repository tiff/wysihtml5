module("wysihtml5.utils.getInDomElement", {
  teardown: function() {
    $$("iframe.wysihtml5-sandbox").invoke("remove");
  }
});

test("Basic test", function() {
  var result;
  
  result = wysihtml5.utils.getInDomElement('<span id="get-in-dom-element-test">foo</span>');
  equals(result.nodeName, "DIV");
  equals(result.ownerDocument, document);
  equals(result.firstChild.nodeName, "SPAN");
  equals(result.childNodes.length , 1);
  equals(result.firstChild.innerHTML, "foo");
  ok(!document.getElementById("get-in-dom-element-test"));
  
  result = wysihtml5.utils.getInDomElement("<i>1</i> <b>2</b>");
  equals(result.childNodes.length, 3);
  
  result = wysihtml5.utils.getInDomElement(document.createElement("div"));
  equals(result.innerHTML.toLowerCase(), "<div></div>");
});


test("HTML5 elements", function() {
  var result;
  
  result = wysihtml5.utils.getInDomElement("<article><span>foo</span></article>");
  equals(result.firstChild.nodeName.toLowerCase(), "article");
  equals(result.firstChild.innerHTML.toLowerCase(), "<span>foo</span>");
  
  result = wysihtml5.utils.getInDomElement("<output>foo</output>");
  equals(result.innerHTML.toLowerCase(), "<output>foo</output>");
});


test("Different document context", function() {
  expect(2);
  stop(5000);
  
  new wysihtml5.utils.Sandbox(function(sandbox) {
    var result;
    
    result = wysihtml5.utils.getInDomElement("<div>hello</div>", sandbox.getDocument());
    equals(result.firstChild.ownerDocument, sandbox.getDocument());
    
    result = wysihtml5.utils.getInDomElement("<header>hello</header>", sandbox.getDocument());
    equals(result.innerHTML.toLowerCase(), "<header>hello</header>");
    
    start();
  }, { insertInto: document.body });
});