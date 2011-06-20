/**
 * Converts speech-to-text and inserts this into the editor
 * As of now (2011/03/25) this only is supported in Chrome >= 11
 *
 * Note that it sends the recorded audio to the google speech recognition api:
 * http://stackoverflow.com/questions/4361826/does-chrome-have-buil-in-speech-recognition-for-input-type-text-x-webkit-speec
 *
 * Current HTML5 draft can be found here
 * http://lists.w3.org/Archives/Public/public-xg-htmlspeech/2011Feb/att-0020/api-draft.html
 * 
 * "Accessing Google Speech API Chrome 11"
 * http://mikepultz.com/2011/03/accessing-google-speech-api-chrome-11/
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 */
wysihtml5.toolbar.Speech = (function() {
  var linkStyle = {
    position: "relative"
  };
  
  var inputStyle = {
    cursor:     "inherit",
    fontSize:   "50px",
    height:     "50px",
    marginTop:  "-25px",
    outline:    0,
    padding:    0,
    position:   "absolute",
    right:      "-12px",
    top:        "50%"
  };
  
  var wrapperStyle = {
    left:     0,
    margin:   0,
    opacity:  0,
    overflow: "hidden",
    padding:  0,
    position: "absolute",
    top:      0,
    zIndex:   1
  };
  
  var supportsSpeechInput = function(input) {
    var chromeVersion = navigator.userAgent.match(/Chrome\/(\d+)/) || [, 0];
    return chromeVersion[1] >= 11 && ("onwebkitspeechchange" in input || "speech" in input);
  };
  
  return function(parent, link) {
    var input = new Element("input");
    if (!supportsSpeechInput(input)) {
      link.hide();
      return;
    }
    
    var wrapper = new Element("div");
    
    Object.extend(wrapperStyle, {
      width:  link.getWidth()  + "px",
      height: link.getHeight() + "px"
    });
    
    input.setStyle(inputStyle).writeAttribute({ "x-webkit-speech": "", "speech": "" });
    wrapper.setStyle(wrapperStyle).insert(input);
    link.setStyle(linkStyle).insert(wrapper);
    
    var eventName = "onwebkitspeechchange" in input ? "webkitspeechchange" : "speechchange";
    input.on(eventName, function() {
      parent.execCommand("insertText", input.value);
      input.value = "";
    });
    
    wrapper.on("click", function(event) {
      if (link.hasClassName("wysihtml5-command-disabled")) {
        event.preventDefault();
      }
      
      event.stopPropagation();
    });
  };
})();