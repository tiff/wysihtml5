module("wysihtml5.dom.getAsDom", {
  teardown: function() {
    var iframe;
    while (iframe = document.querySelector("iframe.wysihtml5-sandbox")) {
      iframe.parentNode.removeChild(iframe);
    }
  }
});

test("Basic test", function() {
  var result;
  
  result = wysihtml5.dom.getAsDom('<span id="get-in-dom-element-test">foo</span>');
  equals(result.nodeName, "DIV");
  equals(result.ownerDocument, document);
  equals(result.firstChild.nodeName, "SPAN");
  equals(result.childNodes.length , 1);
  equals(result.firstChild.innerHTML, "foo");
  ok(!document.getElementById("get-in-dom-element-test"));
  
  result = wysihtml5.dom.getAsDom("<i>1</i> <b>2</b>");
  equals(result.childNodes.length, 3);
  
  result = wysihtml5.dom.getAsDom(document.createElement("div"));
  equals(result.innerHTML.toLowerCase(), "<div></div>");
});


test("HTML5 elements", function() {
  var result;
  
  result = wysihtml5.dom.getAsDom("<article><span>foo</span></article>");
  equals(result.firstChild.nodeName.toLowerCase(), "article");
  equals(result.firstChild.innerHTML.toLowerCase(), "<span>foo</span>");
  
  result = wysihtml5.dom.getAsDom("<output>foo</output>");
  equals(result.innerHTML.toLowerCase(), "<output>foo</output>");
});


asyncTest("Different document context", function() {
  expect(2);
  
  new wysihtml5.dom.Sandbox(function(sandbox) {
    var result;
    
    result = wysihtml5.dom.getAsDom("<div>hello</div>", sandbox.getDocument());
    equals(result.firstChild.ownerDocument, sandbox.getDocument());
    
    result = wysihtml5.dom.getAsDom("<header>hello</header>", sandbox.getDocument());
    equals(result.innerHTML.toLowerCase(), "<header>hello</header>");
    
    start();
  }).insertInto(document.body);
});