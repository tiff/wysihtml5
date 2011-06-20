module("wysihtml5.utils.hasElementWithTagName", {
  teardown: function() {
    $$("iframe.wysihtml5-sandbox").invoke("stopObserving").invoke("remove");
  }
});


test("Basic test", function() {
  stop(4000);
  expect(3);
  
  new wysihtml5.utils.Sandbox(function(sandbox) {
    var doc         = sandbox.getDocument(),
        tempElement = doc.createElement("i");
    ok(!wysihtml5.utils.hasElementWithTagName(doc, "I"));
    doc.body.appendChild(tempElement);
    ok(wysihtml5.utils.hasElementWithTagName(doc, "I"));
    tempElement.parentNode.removeChild(tempElement);
    ok(!wysihtml5.utils.hasElementWithTagName(doc, "I"));
    
    start();
  }.bind(this), { insertInto: document.body });
});