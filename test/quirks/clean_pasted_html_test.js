if (wysihtml5.browserSupports.contentEditable()) {
  module("wysihtml5.quirks.cleanPastedHTML");

  test("Basic test", function() {
    wysihtml5.assert.htmlEquals(
      wysihtml5.quirks.cleanPastedHTML("<u>See: </u><a href=\"http://www.google.com\"><u><b>best search engine</b></u></a>"),
      "<u>See: </u><a href=\"http://www.google.com\"><b>best search engine</b></a>",
      "Correctly removed <u> within <a>"
    );
  });
}