module("wysihtml5.lang.string");

test("trim()", function() {
  equal(wysihtml5.lang.string("   foo   \n").trim(), "foo");
});

test("interpolate()", function() {
  equal(
    wysihtml5.lang.string("Hello #{name}, I LOVE YOUR NAME. IT'S VERY GERMAN AND SOUNDS STRONG.").interpolate({ name: "Reinhold" }),
    "Hello Reinhold, I LOVE YOUR NAME. IT'S VERY GERMAN AND SOUNDS STRONG."
  );
});

test("replace()", function() {
  equal(
    wysihtml5.lang.string("I LOVE CAKE").replace("CAKE").by("BOOBS"),
    "I LOVE BOOBS"
  );
});