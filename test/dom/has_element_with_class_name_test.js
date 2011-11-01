if ("querySelector" in document || wysihtml5.browser.supportsNativeGetElementsByClassName()) {
  module("wysihtml5.dom.hasElementWithClassName", {
    teardown: function() {
      var iframe;
      while (iframe = document.querySelector("iframe.wysihtml5-sandbox")) {
        iframe.parentNode.removeChild(iframe);
      }
    }
  });


  asyncTest("Basic test", function() {
    expect(3);
    
    new wysihtml5.dom.Sandbox(function(sandbox) {
      var doc         = sandbox.getDocument(),
          tempElement = doc.createElement("i");
      tempElement.className = "wysiwyg-color-aqua";

      ok(!wysihtml5.dom.hasElementWithClassName(doc, "wysiwyg-color-aqua"));
      doc.body.appendChild(tempElement);
      ok(wysihtml5.dom.hasElementWithClassName(doc, "wysiwyg-color-aqua"));
      tempElement.parentNode.removeChild(tempElement);
      ok(!wysihtml5.dom.hasElementWithClassName(doc, "wysiwyg-color-aqua"));

      start();
    }).insertInto(document.body);
  });
}
