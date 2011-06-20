VERSION = $(shell cat version.txt)

JS_OUTPUT = "dist/wysihtml5-${VERSION}.js"

JS_FILES = lib/rangy/rangy-core.js \
  lib/rangy/rangy-cssclassapplier-wysihtml5.js \
  src/wysihtml5.js \
  src/browser_support.js \
  src/utils/auto_focus.js \
  src/utils/auto_link.js \
  src/utils/caret.js \
  src/utils/contains.js \
  src/utils/convert_into_list.js \
  src/utils/copy_styles.js \
  src/utils/copy_attributes.js \
  src/utils/get_in_dom_element.js \
  src/utils/get_parent_element.js \
  src/utils/get_style.js \
  src/utils/has_element_with_tag_name.js \
  src/utils/has_element_with_class_name.js \
  src/utils/insert_rules.js \
  src/utils/observe.js \
  src/utils/resolve_list.js \
  src/utils/rename_element.js \
  src/utils/remove_empty_text_nodes.js \
  src/utils/sandbox.js \
  src/utils/sanitize_html.js \
  src/utils/simulate_placeholder.js \
  src/utils/synchronizer.js \
  src/utils/text_content.js \
  src/utils/unwrap.js \
  src/quirks/clean_pasted_html.js \
  src/quirks/ensure_proper_clearing.js \
  src/quirks/insert_line_break_on_return.js \
  src/quirks/redraw.js \
  src/views/view.js \
  src/views/composer.js \
  src/views/composer.style.js \
  src/views/composer.observe.js \
  src/views/textarea.js \
  src/toolbar/dialog.js \
  src/toolbar/speech.js \
  src/toolbar/toolbar.js \
  src/commands.js \
  src/commands/bold.js \
  src/commands/createLink.js \
  src/commands/fontSize.js \
  src/commands/foreColor.js \
  src/commands/formatBlock.js \
  src/commands/formatInline.js \
  src/commands/insertHTML.js \
  src/commands/insertImage.js \
  src/commands/insertLineBreak.js \
  src/commands/insertOrderedList.js \
  src/commands/insertUnorderedList.js \
  src/commands/italic.js \
  src/commands/justifyCenter.js \
  src/commands/justifyLeft.js \
  src/commands/justifyRight.js \
  src/commands/underline.js \
  src/editor.js

all:
	@@rm ${JS_OUTPUT}
	@@cat ${JS_FILES} >> ${JS_OUTPUT}