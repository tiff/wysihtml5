module("wysihtml5.lang.object");

test("merge()", function() {
  var obj         = { foo: 1, bar: 1 },
      returnValue = wysihtml5.lang.object(obj).merge({ bar: 2, baz: 3 }).get();
  equal(returnValue, obj);
  deepEqual(obj, { foo: 1, bar: 2, baz: 3 });
});

test("clone()", function() {
  var obj = { foo: true },
      returnValue = wysihtml5.lang.object(obj).clone();
  ok(obj != returnValue);
  deepEqual(obj, returnValue);
});

test("isArray()", function() {
  ok(wysihtml5.lang.object([]).isArray());
  ok(!wysihtml5.lang.object({}).isArray());
  ok(!wysihtml5.lang.object(document.body.childNodes).isArray());
  ok(!wysihtml5.lang.object("1,2,3").isArray());
});