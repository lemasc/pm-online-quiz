import SimpleMarkdown from "simple-markdown";
import katex from "katex";
import { MarkdownRule } from "./types";

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

export const mathRules: Record<string, MarkdownRule> = {
  math: {
    order: SimpleMarkdown.defaultRules.link.order - 0.25,
    match: (source, state) => mathMatcher(source, state, false),
    parse: (capture, parse, state) => {
      return {
        content: capture[1],
      };
    },
    html: (node, output) => {
      return renderMath(node.content);
    },
  },
  blockMath: {
    order: SimpleMarkdown.defaultRules.codeBlock.order + 0.5,
    match: (source, state) => mathMatcher(source, state, true),
    parse: (capture, parse, state) => {
      return {
        content: capture[1],
      };
    },
    html: (node, output) => {
      return renderMath(node.content);
    },
  },
};

/**
 * (Borrowed from `perseus` library.)
 *
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
const mathMatcher = (
  source: string,
  state: SimpleMarkdown.State,
  isBlock: boolean
) => {
  var length = source.length;
  var index = 0;

  // When looking for blocks, skip over leading spaces
  if (isBlock) {
    if (state.inline) {
      return null;
    }
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
