module("wysihtml5.dom.hasElementWithTagName", {
  teardown: function() {
    var iframe;
    while (iframe = document.querySelector("iframe.wysihtml5-sandbox")) {
      iframe.parentNode.removeChild(iframe);
    }
  }
});


test("Basic test", function() {
  stop(4000);
  expect(3);
  
  new wysihtml5.dom.Sandbox(function(sandbox) {
    var doc         = sandbox.getDocument(),
        tempElement = doc.createElement("i");
    ok(!wysihtml5.dom.hasElementWithTagName(doc, "I"));
    doc.body.appendChild(tempElement);
    ok(wysihtml5.dom.hasElementWithTagName(doc, "I"));
    tempElement.parentNode.removeChild(tempElement);
    ok(!wysihtml5.dom.hasElementWithTagName(doc, "I"));
    
    start();
  }).insertInto(document.body);
});