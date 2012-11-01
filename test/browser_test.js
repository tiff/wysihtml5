module("wysihtml5.browser", {
  userAgents: {
    iPad_iOS3:    "Mozilla/5.0 (iPad; U; CPU OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B334b Safari/531.21.10",
    iPhone_iOS3:  "Mozilla/5.0 (iPhone; U; CPU like Mac OS X; en) AppleWebKit/420+ (KHTML, like Gecko) Version/3.0 Mobile/1A543a Safari/419.3",
    iPad_iOS5:    "Mozilla/5.0 (iPad; CPU OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3",
    Android2:      "Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17",
    Android4:      "Mozilla/5.0 (Linux; U; Android 4.0.4; en-gb; GT-I9300 Build/IMM76D) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30",
    Chrome:       "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_8; en-US) AppleWebKit/534.7 (KHTML, like Gecko) Chrome/7.0.517.44 Safari/534.7",
    OperaMobile:  "Opera/9.80 (S60; SymbOS; Opera Mobi/498; U; en-GB) Presto/2.4.18 Version/10.00",
    IE6:          "Mozilla/4.0 (Compatible; Windows NT 5.1; MSIE 6.0) (compatible; MSIE 6.0; Windows NT 5.1; .NET CLR 1.1.4322; .NET CLR 2.0.50727)",
    IE7:          "Mozilla/5.0 (compatible; MSIE 7.0; Windows NT 6.0; WOW64; SLCC1; .NET CLR 2.0.50727; Media Center PC 5.0; c .NET CLR 3.0.04506; .NET CLR 3.5.30707; InfoPath.1; el-GR)",
    IE8:          "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; SLCC1; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET CLR 1.1.4322)",
    IE9:          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; Media Center PC 6.0; InfoPath.3; MS-RTC LM 8; Zune 4.7)"
  },
  
  setup: function() {
    this.originalUserAgent          = wysihtml5.browser.USER_AGENT;
    this.originalExecCommand        = document.execCommand;
    this.originalQuerySelector      = document.querySelector;
    this.originalQuerySelectorAll   = document.querySelectorAll;
  },
  
  teardown: function() {
    wysihtml5.browser.USER_AGENT = this.originalUserAgent;
    document.execCommand = this.originalExecCommand;
    document.querySelector = this.originalQuerySelector;
    document.querySelectorAll = this.originalQuerySelectorAll;
  }
});


test("Check mobile contentEditable support", function() {
  document.querySelector = document.querySelectorAll = function() {};
  
  wysihtml5.browser.USER_AGENT = this.userAgents.iPad_iOS3;
  ok(!wysihtml5.browser.supported(), "iPad iOS 3 is correctly unsupported");
  
  wysihtml5.browser.USER_AGENT = this.userAgents.iPhone_iOS3;
  ok(!wysihtml5.browser.supported(), "iPhone iOS 3 is correctly unsupported");
  
  wysihtml5.browser.USER_AGENT = this.userAgents.iPad_iOS5;
  ok(wysihtml5.browser.supported(), "iPad iOS 5 is correctly supported");
  
  wysihtml5.browser.USER_AGENT = this.userAgents.Android2;
  ok(!wysihtml5.browser.supported(), "Android 2 is correctly unsupported");
  
  wysihtml5.browser.USER_AGENT = this.userAgents.Android4;
  ok(wysihtml5.browser.supported(), "Android 4 is correctly supported");
  
  wysihtml5.browser.USER_AGENT = this.userAgents.OperaMobile;
  ok(!wysihtml5.browser.supported(), "Opera Mobile is correctly unsupported");
});


test("Check with missing document.execCommand", function() {
  document.execCommand = null;
  // I've no idea why this test fails in Opera... (if you run the test alone, everything works)
  ok(!wysihtml5.browser.supported(), "Missing document.execCommand causes editor to be unsupported");
});


test("Check IE support", function() {
  wysihtml5.browser.USER_AGENT = this.userAgents.IE6;
  document.querySelector = document.querySelectorAll = null;
  ok(!wysihtml5.browser.supported(), "IE6 is correctly unsupported");
  
  wysihtml5.browser.USER_AGENT = this.userAgents.IE7;
  document.querySelector = document.querySelectorAll = null;
  ok(!wysihtml5.browser.supported(), "IE7 is correctly unsupported");
  
  wysihtml5.browser.USER_AGENT = this.userAgents.IE8;
  document.querySelector = document.querySelectorAll = function() {};
  ok(wysihtml5.browser.supported(), "IE8 is correctly supported");
  
  wysihtml5.browser.USER_AGENT = this.userAgents.IE9;
  document.querySelector = document.querySelectorAll = function() {};
  ok(wysihtml5.browser.supported(), "IE9 is correctly supported");
});


test("Check placeholder support", function() {
  var pseudoElement = document.createElement("div");
  pseudoElement.placeholder = "";
  ok(wysihtml5.browser.supportsPlaceholderAttributeOn(pseudoElement));
});