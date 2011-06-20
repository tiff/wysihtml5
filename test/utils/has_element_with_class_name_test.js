if ("querySelector" in document || wysihtml5.browserSupports.getElementsByClassName()) {
  module("wysihtml5.utils.hasElementWithClassName", {
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
      tempElement.className = "wysiwyg-color-aqua";

      ok(!wysihtml5.utils.hasElementWithClassName(doc, "wysiwyg-color-aqua"));
      doc.body.appendChild(tempElement);
      ok(wysihtml5.utils.hasElementWithClassName(doc, "wysiwyg-color-aqua"));
      tempElement.parentNode.removeChild(tempElement);
      ok(!wysihtml5.utils.hasElementWithClassName(doc, "wysiwyg-color-aqua"));

      start();
    }.bind(this), { insertInto: document.body });
  });
}
