import { PluginFn } from "@toast-ui/editor/types/editor";
import katex from "katex";

function renderMath(str: string) {
  try {
    return katex.renderToString(str, {
      displayMode: false,
    });
  } catch (err) {
    if (err instanceof katex.ParseError) {
      return `<span class='text-red-500 font-bold font-mono block'>${err.message}</span>`;
    }
    return str;
  }
}

/**
 * This match function matches math in `$`s, such as:
 *
 * $y = x + 1$
 *
 * It functions roughly like the following regex:
 * /\$([^\$]*)\$/
 *
 * Unfortunately, math may have other `$`s inside it, as
 * long as they are inside `{` braces `}`, mostly for
 * `\text{ $math$ }`.
 *
 * To parse this, we can't use a regex, since we
 * should support arbitrary nesting (even though
 * MathJax actually only supports two levels of nesting
 * here, which we *could* parse with a regex).
 *
 * Non-regex matchers like this are now a first-class
 * concept in simple-markdown. Yay!
 *
 * This can also match block-math, which is math alone in a paragraph.
 */
var mathMatcher = (source: string, isBlock: boolean) => {
  var length = source.length;
  var index = 0;

  // When looking for blocks, skip over leading spaces
  if (isBlock) {
    /*if (state.inline) {
          return null;
      }*/
    while (index < length && source[index] === " ") {
      index++;
    }
  }

  // Our source must start with a "$"
  if (!(index < length && source[index] === "$")) {
    return null;
  }

  index++;
  var startIndex = index;
  var braceLevel = 0;

  // Loop through the source, looking for a closing '$'
  // closing '$'s only count if they are not escaped with
  // a `\`, and we are not in nested `{}` braces.
  while (index < length) {
    var character = source[index];

    if (character === "\\") {
      // Consume both the `\` and the escaped char as a single
      // token.
      // This is so that the second `$` in `$\\$` closes
      // the math expression, since the first `\` is escaping
      // the second `\`, but the second `\` is not escaping
      // the second `$`.
      // This also handles the case of escaping `$`s or
      // braces `\{`
      index++;
    } else if (braceLevel <= 0 && character === "$") {
      var endIndex: number | null = index + 1;
      if (isBlock) {
        // Look for two trailing newlines after the closing `$`
        var match = /^(?: *\n){2,}/.exec(source.slice(endIndex));
        endIndex = match ? endIndex + match[0].length : null;
      }

      // Return an array that looks like the results of a
      // regex's .exec function:
      // capture[0] is the whole string
      // capture[1] is the first "paren" match, which is the
      //   content of the math here, as if we wrote the regex
      //   /\$([^\$]*)\$/
      if (endIndex) {
        return [
          source.substring(0, endIndex),
          source.substring(startIndex, index),
        ];
      }
      return null;
    } else if (character === "{") {
      braceLevel++;
    } else if (character === "}") {
      braceLevel--;
    } else if (character === "\n" && source[index - 1] === "\n") {
      // This is a weird case we supported in the old
      // math implementation--double newlines break
      // math. I'm preserving it for now because content
      // creators might have questions with single '$'s
      // in paragraphs...
      return null;
    }

    index++;
  }

  // we didn't find a closing `$`
  return null;
};

/**
 * Get html from the complete string
 * @param {String} str text
 * @returns {String} str rendered html combined with input
 */
function getInlineMath(str: string | null) {
  if (!str) return "";
  let prevIdx = 0;
  let nextIdx = -1;
  /* while (true) {
    prevIdx = str.indexOf("$", prevIdx);
    nextIdx = str.indexOf("$", prevIdx + 1);
    if (nextIdx == -1 || prevIdx == -1) break;
    str = str.replace(
      str.slice(prevIdx, nextIdx - prevIdx + 1),
      renderMath(str.slice(prevIdx + 1, nextIdx - prevIdx))
    );
    if (nextIdx !== -1) prevIdx = nextIdx + 1;
  }
*/
  return str;
}

export const mathPlugin: PluginFn = () => {
  return {
    toHTMLRenderers: {
      text(node, context) {
        return {
          type: "html",
          content: getInlineMath(node.literal),
        };
      },
    },
  };
};
