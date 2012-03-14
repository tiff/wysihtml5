if (wysihtml5.browser.supported()) {
  module("wysihtml5.quirks.cleanPastedHTML");

  test("Basic test", function() {
    wysihtml5.assert.htmlEqual(
      wysihtml5.quirks.cleanPastedHTML("<u>See: </u><a href=\"http://www.google.com\"><u><b>best search engine</b></u></a>"),
      "<u>See: </u><a href=\"http://www.google.com\"><b>best search engine</b></a>",
      "Correctly removed <u> within <a>"
    );
  });
}