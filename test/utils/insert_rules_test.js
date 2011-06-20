module("wysihtml5.utils.insertRules", {
  teardown: function() {
    $$("iframe.wysihtml5-sandbox").invoke("stopObserving").invoke("remove");
  }
});

test("Basic Tests with IE=Edge", function() {
  expect(3);
  stop();
  
  new wysihtml5.utils.Sandbox(function(sandbox) {
    var doc     = sandbox.getDocument(),
        body    = doc.body,
        element = doc.createElement("sub");
    
    body.appendChild(element);
    
    wysihtml5.utils.insertRules([
      "sub { display: block; text-align: right; }",
      "body { text-indent: 50px; }"
    ]).into(doc);
    
    equals(wysihtml5.utils.getStyle(element, "display"),    "block");
    equals(wysihtml5.utils.getStyle(element, "text-align"), "right");
    equals(wysihtml5.utils.getStyle(body, "text-indent"),   "50px");
    
    start();
  }, { insertInto: document.body, uaCompatible: "IE=Edge" });
});

test("Basic Tests with IE=7", function() {
  expect(3);
  stop();
  
  new wysihtml5.utils.Sandbox(function(sandbox) {
    var doc     = sandbox.getDocument(),
        body    = doc.body,
        element = doc.createElement("sub");
    
    body.appendChild(element);
    
    wysihtml5.utils.insertRules([
      "sub { display: block; text-align: right; }",
      "body { text-indent: 50px; }"
    ]).into(doc);
    
    equals(wysihtml5.utils.getStyle(element, "display"),    "block");
    equals(wysihtml5.utils.getStyle(element, "text-align"), "right");
    equals(wysihtml5.utils.getStyle(body, "text-indent"),   "50px");
    
    start();
  }, { insertInto: document.body, uaCompatible: "IE=7" });
});