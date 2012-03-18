module("wysihtml5.dom.insertCSS", {
  teardown: function() {
    var iframe;
    while (iframe = document.querySelector("iframe.wysihtml5-sandbox")) {
      iframe.parentNode.removeChild(iframe);
    }
  }
});

asyncTest("Basic Tests", function() {
  expect(3);
  
  new wysihtml5.dom.Sandbox(function(sandbox) {
    var doc     = sandbox.getDocument(),
        body    = doc.body,
        element = doc.createElement("sub");
    
    body.appendChild(element);
    
    wysihtml5.dom.insertCSS([
      "sub  { display: block; text-align: right; }",
      "body { text-indent: 50px; }"
    ]).into(doc);
    
    equal(wysihtml5.dom.getStyle("display")    .from(element), "block");
    equal(wysihtml5.dom.getStyle("text-align") .from(element), "right");
    equal(wysihtml5.dom.getStyle("text-indent").from(element), "50px");
    
    start();
  }).insertInto(document.body);
});