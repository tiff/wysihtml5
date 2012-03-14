if (wysihtml5.browser.supported()) {

  module("wysihtml5.dom.parse", {
    sanitize: function(html, rules, context, cleanUp) {
      return wysihtml5.dom.parse(html, rules, context, cleanUp);
    },

    equal: function(actual, expected, message) {
      return wysihtml5.assert.htmlEqual(actual, expected, message);
    }
  });

  test("Simple tests using plain tags only", function() {
    var rules = {
      tags: {
        p:      "div",
        script: undefined,
        div:    {}
      }
    };

    this.equal(
      this.sanitize("<i id=\"foo\">bar</i>", rules),
      "<span>bar</span>",
      "Unknown tag gets renamed to span"
    );

    this.equal(
      this.sanitize("<p>foo</p>", rules),
      "<div>foo</div>",
      "Known tag gets renamed to it's corresponding conversion"
    );

    this.equal(
      this.sanitize("<script>window;</script>", rules),
      "",
      "Forbidden tag gets correctly removed"
    );

    this.equal(
      this.sanitize("foobar", rules),
      "foobar",
      "Plain text is kept"
    );

    this.equal(
      this.sanitize("<table><tbody><tr><td>I'm a table!</td></tr></tbody></table>"),
      "<span><span><span><span>I'm a table!</span></span></span></span>",
      "Passing no conversion renames all into <span> elements"
    );

    this.equal(
      this.sanitize("<p>foobar<br></p>", { tags: { p: true, br: true } }),
      "<p>foobar<br></p>",
      "Didn't rewrite the HTML"
    );

    this.equal(
      this.sanitize("<div><!-- COMMENT -->foo</div>"),
      "<span>foo</span>",
      "Stripped out comments"
    );
    
    this.equal(
      this.sanitize("<article>foo</article>", { tags: { article: true } }),
      "<article>foo</article>",
      "Check html5 tags"
    );
    
    this.equal(
      this.sanitize("<!DOCTYPE html><p>html5 doctype</p>", { tags: { p: true } }),
      "<p>html5 doctype</p>",
      "Stripped out doctype"
    );
  });


  test("Advanced tests using tags and attributes", function() {
    var rules = {
      tags: {
        img: {
          set_attributes: { alt: "foo", border: "1" },
          check_attributes: { src: "url", width: "numbers", height: "numbers", border: "numbers" }
        },
        a: {
          rename_tag: "i",
          set_attributes: { title: "" }
        },
        video: undefined,
        h1: { rename_tag: "h2" },
        h2: true,
        h3: undefined
      }
    };

    this.equal(
      this.sanitize(
        '<h1 id="main-headline" >take this you snorty little sanitizer</h1>' +
        '<h2>yes, you!</h2>' +
        '<h3>i\'m old and ready to die</h3>' +
        '<div><video src="pr0n.avi">foobar</video><img src="http://foo.gif" height="10" width="10"></div>' +
        '<div><a href="http://www.google.de"></a></div>',
        rules
      ),
      '<h2>take this you snorty little sanitizer</h2>' +
      '<h2>yes, you!</h2>' +
      '<span><img alt="foo" border="1" src="http://foo.gif" height="10" width="10"></span>' +
      '<span><i title=""></i></span>'
    );
  });


  test("Bug in IE8 where invalid html causes duplicated content", function() {
    var rules = {
      tags: { p: true, span: true, div: true }
    };
    
    var result = this.sanitize('<SPAN><P><SPAN><div>FOO</div>', rules);
    ok(result.indexOf("FOO") === result.lastIndexOf("FOO"));
  });
  
  
  test("Bug in IE8 where elements are duplicated when multiple parsed", function() {
    var rules = {
      tags: { p: true, span: true, div: true }
    };
    
    var firstResult = this.sanitize('<SPAN><P><SPAN>foo<P></P>', rules);
    var secondResult = this.sanitize(firstResult, rules);
    
    ok(secondResult.indexOf("foo") !== -1);
    this.equal(firstResult, secondResult);
    
    firstResult = this.sanitize('<SPAN><DIV><SPAN>foo<DIV></DIV>', rules);
    secondResult = this.sanitize(firstResult, rules);
    
    ok(secondResult.indexOf("foo") !== -1);
    this.equal(firstResult, secondResult);
  });
  
  test("Test cleanup mode", function() {
    var rules = {
      tags: { span: true, div: true }
    };
    
    this.equal(
      this.sanitize("<div><span>foo</span></div>", rules, null, true),
      "<div>foo</div>"
    );
    
    this.equal(
      this.sanitize("<span><p>foo</p></span>", rules, null, true),
      "foo"
    );
  });
  
  
  test("Advanced tests for 'img' elements", function() {
    var rules = {
      classes: {
        "wysiwyg-float-right":  1,
        "wysiwyg-float-left":   1
      },
      tags: {
        img: {
          check_attributes: {
            width:    "numbers",
            alt:      "alt",
            src:      "url",
            height:   "numbers"
          },
          add_class: {
            align: "align_img"
          }
        }
      }
    };

    this.equal(
      this.sanitize(
        '<img src="https://www.xing.com/img/users/1/2/7/f98db1f73.6149675_s4.jpg" alt="Christopher Blum" width="57" height="75" class="wysiwyg-float-right">',
        rules
      ),
      '<img alt="Christopher Blum" class="wysiwyg-float-right" height="75" src="https://www.xing.com/img/users/1/2/7/f98db1f73.6149675_s4.jpg" width="57">'
    );

    this.equal(
      this.sanitize(
        '<img src="https://www.xing.com/img/users/1/2/7/f98db1f73.6149675_s4.jpg" alt="Christopher Blum" width="57" height="75" ALIGN="RIGHT">',
        rules
      ),
      '<img alt="Christopher Blum" class="wysiwyg-float-right" height="75" src="https://www.xing.com/img/users/1/2/7/f98db1f73.6149675_s4.jpg" width="57">'
    );

    this.equal(
      this.sanitize(
        '<img src="https://www.xing.com/img/users/1/2/7/f98db1f73.6149675_s4.jpg" alt="Christopher Blum" width="57" height="75" align="left">',
        rules
      ),
      '<img alt="Christopher Blum" class="wysiwyg-float-left" height="75" src="https://www.xing.com/img/users/1/2/7/f98db1f73.6149675_s4.jpg" width="57">'
    );

    this.equal(
      this.sanitize(
        '<img src="https://www.xing.com/img/users/1/2/7/f98db1f73.6149675_s4.jpg" alt="Christopher Blum" width="57" height="75" align="">',
        rules
      ),
      '<img alt="Christopher Blum" height="75" src="https://www.xing.com/img/users/1/2/7/f98db1f73.6149675_s4.jpg" width="57">'
    );

    this.equal(
      this.sanitize(
        '<img src="/img/users/1/2/7/f98db1f73.6149675_s4.jpg" alt="Christopher Blum" width="57" height="75">',
        rules
      ),
      '<img alt="Christopher Blum" height="75" width="57">'
    );

    this.equal(
      this.sanitize(
        '<img src="file://foobar.jpg" alt="Christopher Blum" width="57" height="75">',
        rules
      ),
      '<img alt="Christopher Blum" height="75" width="57">'
    );

    this.equal(
      this.sanitize(
        '<img src="https://www.xing.com/img/users/1/2/7/f98db1f73.6149675_s4.jpg" width="57" height="75">',
        rules
      ),
      '<img alt="" height="75" src="https://www.xing.com/img/users/1/2/7/f98db1f73.6149675_s4.jpg" width="57">'
    );

    this.equal(
      this.sanitize(
        '<img>',
        rules
      ),
      '<img alt="">'
    );
  });


  test("Advanced tests for 'br' elements", function() {
    var rules = {
      classes: {
        "wysiwyg-clear-both":   1,
        "wysiwyg-clear-left":   1,
        "wysiwyg-clear-right":  1
      },
      tags: {
        div: true,
        br: {
          add_class: {
            clear: "clear_br"
          }
        }
      }
    };

    this.equal(
      this.sanitize(
        '<div>foo<br clear="both">bar</div>',
        rules
      ),
      '<div>foo<br class="wysiwyg-clear-both">bar</div>'
    );

    this.equal(
      this.sanitize(
        '<div>foo<br clear="all">bar</div>',
        rules
      ),
      '<div>foo<br class="wysiwyg-clear-both">bar</div>'
    );

    this.equal(
      this.sanitize(
        '<div>foo<br clear="left" id="foo">bar</div>',
        rules
      ),
      '<div>foo<br class="wysiwyg-clear-left">bar</div>'
    );

    this.equal(
      this.sanitize(
        '<br clear="right">',
        rules
      ),
      '<br class="wysiwyg-clear-right">'
    );

    this.equal(
      this.sanitize(
        '<br clear="">',
        rules
      ),
      '<br>'
    );

    this.equal(
      this.sanitize(
        '<br clear="LEFT">',
        rules
      ),
      '<br class="wysiwyg-clear-left">'
    );
    
    this.equal(
      this.sanitize(
        '<br class="wysiwyg-clear-left">',
        rules
      ),
      '<br class="wysiwyg-clear-left">'
    );
    
    this.equal(
      this.sanitize(
        '<br clear="left" class="wysiwyg-clear-left">',
        rules
      ),
      '<br class="wysiwyg-clear-left">'
    );
    
    this.equal(
      this.sanitize(
        '<br clear="left" class="wysiwyg-clear-left wysiwyg-clear-right">',
        rules
      ),
      '<br class="wysiwyg-clear-left wysiwyg-clear-right">'
    );
    
    this.equal(
      this.sanitize(
        '<br clear="left" class="wysiwyg-clear-right">',
        rules
      ),
      '<br class="wysiwyg-clear-left wysiwyg-clear-right">'
    );
  });
  
  
  test("Advanced tests for 'font' elements", function() {
    var rules = {
      classes: {
        "wysiwyg-font-size-xx-small": 1,
        "wysiwyg-font-size-small":    1,
        "wysiwyg-font-size-medium":   1,
        "wysiwyg-font-size-large":    1,
        "wysiwyg-font-size-x-large":  1,
        "wysiwyg-font-size-xx-large": 1,
        "wysiwyg-font-size-smaller":  1,
        "wysiwyg-font-size-larger":   1
      },
      tags: {
        font: {
          add_class: { size: "size_font" },
          rename_tag: "span"
        }
      }
    };
    
    this.equal(
      this.sanitize(
        '<font size="1">foo</font>',
        rules
      ),
      '<span class="wysiwyg-font-size-xx-small">foo</span>'
    );
    
    this.equal(
      this.sanitize(
        '<font size="2">foo</font>',
        rules
      ),
      '<span class="wysiwyg-font-size-small">foo</span>'
    );
    
    this.equal(
      this.sanitize(
        '<font size="3">foo</font>',
        rules
      ),
      '<span class="wysiwyg-font-size-medium">foo</span>'
    );
    
    this.equal(
      this.sanitize(
        '<font size="4">foo</font>',
        rules
      ),
      '<span class="wysiwyg-font-size-large">foo</span>'
    );
    
    this.equal(
      this.sanitize(
        '<font size="5">foo</font>',
        rules
      ),
      '<span class="wysiwyg-font-size-x-large">foo</span>'
    );
    
    this.equal(
      this.sanitize(
        '<font size="6">foo</font>',
        rules
      ),
      '<span class="wysiwyg-font-size-xx-large">foo</span>'
    );
    
    this.equal(
      this.sanitize(
        '<font size="7">foo</font>',
        rules
      ),
      '<span class="wysiwyg-font-size-xx-large">foo</span>'
    );
    
    this.equal(
      this.sanitize(
        '<font size="+1">foo</font>',
        rules
      ),
      '<span class="wysiwyg-font-size-larger">foo</span>'
    );
    
    this.equal(
      this.sanitize(
        '<font size="-1">foo</font>',
        rules
      ),
      '<span class="wysiwyg-font-size-smaller">foo</span>'
    );
  });
  
  
  test("Check whether namespaces are handled correctly", function() {
    var rules = {
      tags: {
        p: true
      }
    };

    this.equal(
      this.sanitize("<o:p>foo</o:p>", rules),
      "<span>foo</span>",
      "Unknown tag with namespace gets renamed to span"
    );
  });
  
  
  test("Check whether classes are correctly treated", function() {
    var rules = {
      classes: {
        a: 1,
        c: 1
      },
      tags: {
        footer: "div"
      }
    };
    
    this.equal(
      this.sanitize('<header class="a b c">foo</header>', rules),
      '<span class="a c">foo</span>',
      "Allowed classes 'a' and 'c' are correctly kept and unknown class 'b' is correctly removed."
    );
    
    this.equal(
      this.sanitize('<footer class="ab c d" class="a">foo</footer>', rules),
      '<div class="c">foo</div>',
      "Allowed classes 'c' is correctly kept and unknown class 'b' is correctly removed."
    );
  });
  
  test("Check Firefox misbehavior with tilde characters in urls", function() {
    var rules = {
      tags: {
        a: {
          set_attributes: {
            target: "_blank",
            rel:    "nofollow"
          },
          check_attributes: {
            href:   "url"
          }
        }
      }
    };
    
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=664398
    //
    // In Firefox this:
    //      var d = document.createElement("div");
    //      d.innerHTML ='<a href="~"></a>';
    //      d.innerHTML;
    // will result in:
    //      <a href="%7E"></a>
    // which is wrong
    ok(
      this.sanitize('<a href="http://google.com/~foo"></a>', rules).indexOf("~") !== -1
    );
  });
}