import {
  __commonJS,
  __toESM
} from "./chunk-DC5AMYBS.js";

// node_modules/obscenity/dist/util/Char.js
var require_Char = __commonJS({
  "node_modules/obscenity/dist/util/Char.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAndAssertSingleCodePoint = exports.invertCaseOfAlphabeticChar = exports.isUpperCase = exports.isLowerCase = exports.isAlphabetic = exports.isDigit = exports.isWordChar = exports.convertSurrogatePairToCodePoint = exports.isLowSurrogate = exports.isHighSurrogate = void 0;
    function isHighSurrogate(char) {
      return 55296 <= char && char <= 56319;
    }
    exports.isHighSurrogate = isHighSurrogate;
    function isLowSurrogate(char) {
      return 56320 <= char && char <= 57343;
    }
    exports.isLowSurrogate = isLowSurrogate;
    function convertSurrogatePairToCodePoint(highSurrogate, lowSurrogate) {
      return (highSurrogate - 55296) * 1024 + lowSurrogate - 56320 + 65536;
    }
    exports.convertSurrogatePairToCodePoint = convertSurrogatePairToCodePoint;
    function isWordChar(char) {
      return isDigit(char) || isAlphabetic(char);
    }
    exports.isWordChar = isWordChar;
    function isDigit(char) {
      return 48 <= char && char <= 57;
    }
    exports.isDigit = isDigit;
    function isAlphabetic(char) {
      return isLowerCase(char) || isUpperCase(char);
    }
    exports.isAlphabetic = isAlphabetic;
    function isLowerCase(char) {
      return 97 <= char && char <= 122;
    }
    exports.isLowerCase = isLowerCase;
    function isUpperCase(char) {
      return 65 <= char && char <= 90;
    }
    exports.isUpperCase = isUpperCase;
    function invertCaseOfAlphabeticChar(char) {
      return char ^ 32;
    }
    exports.invertCaseOfAlphabeticChar = invertCaseOfAlphabeticChar;
    function getAndAssertSingleCodePoint(str) {
      if ([...str].length !== 1)
        throw new RangeError(`Expected the input string to be one code point in length.`);
      return str.codePointAt(0);
    }
    exports.getAndAssertSingleCodePoint = getAndAssertSingleCodePoint;
  }
});

// node_modules/obscenity/dist/censor/BuiltinStrategies.js
var require_BuiltinStrategies = __commonJS({
  "node_modules/obscenity/dist/censor/BuiltinStrategies.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.randomCharFromSetCensorStrategy = exports.fixedCharCensorStrategy = exports.fixedPhraseCensorStrategy = exports.grawlixCensorStrategy = exports.asteriskCensorStrategy = exports.keepEndCensorStrategy = exports.keepStartCensorStrategy = void 0;
    var Char_1 = require_Char();
    function keepStartCensorStrategy2(baseStrategy) {
      return (ctx) => {
        if (ctx.overlapsAtStart)
          return baseStrategy(ctx);
        const firstChar = String.fromCodePoint(ctx.input.codePointAt(ctx.startIndex));
        return firstChar + baseStrategy({ ...ctx, matchLength: ctx.matchLength - 1 });
      };
    }
    exports.keepStartCensorStrategy = keepStartCensorStrategy2;
    function keepEndCensorStrategy2(baseStrategy) {
      return (ctx) => {
        if (ctx.overlapsAtEnd)
          return baseStrategy(ctx);
        const lastChar = String.fromCodePoint(ctx.input.codePointAt(ctx.endIndex));
        return baseStrategy({ ...ctx, matchLength: ctx.matchLength - 1 }) + lastChar;
      };
    }
    exports.keepEndCensorStrategy = keepEndCensorStrategy2;
    function asteriskCensorStrategy2() {
      return fixedCharCensorStrategy2("*");
    }
    exports.asteriskCensorStrategy = asteriskCensorStrategy2;
    function grawlixCensorStrategy2() {
      return randomCharFromSetCensorStrategy2("%@$&*");
    }
    exports.grawlixCensorStrategy = grawlixCensorStrategy2;
    function fixedPhraseCensorStrategy2(phrase) {
      return () => phrase;
    }
    exports.fixedPhraseCensorStrategy = fixedPhraseCensorStrategy2;
    function fixedCharCensorStrategy2(char) {
      (0, Char_1.getAndAssertSingleCodePoint)(char);
      return (ctx) => char.repeat(ctx.matchLength);
    }
    exports.fixedCharCensorStrategy = fixedCharCensorStrategy2;
    function randomCharFromSetCensorStrategy2(charset) {
      const chars = [...charset];
      if (chars.length < 2)
        throw new Error("The character set passed must have at least 2 characters.");
      return (ctx) => {
        if (ctx.matchLength === 0)
          return "";
        let lastIdx = Math.floor(Math.random() * chars.length);
        let censored = chars[lastIdx];
        for (let i = 1; i < ctx.matchLength; i++) {
          let idx = Math.floor(Math.random() * (chars.length - 1));
          if (idx >= lastIdx)
            idx++;
          lastIdx = idx;
          censored += chars[idx];
        }
        return censored;
      };
    }
    exports.randomCharFromSetCensorStrategy = randomCharFromSetCensorStrategy2;
  }
});

// node_modules/obscenity/dist/util/Interval.js
var require_Interval = __commonJS({
  "node_modules/obscenity/dist/util/Interval.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compareIntervals = void 0;
    function compareIntervals(lowerBound0, upperBound0, lowerBound1, upperBound1) {
      if (lowerBound0 < lowerBound1)
        return -1;
      if (lowerBound1 < lowerBound0)
        return 1;
      if (upperBound0 < upperBound1)
        return -1;
      if (upperBound1 < upperBound0)
        return 1;
      return 0;
    }
    exports.compareIntervals = compareIntervals;
  }
});

// node_modules/obscenity/dist/matcher/MatchPayload.js
var require_MatchPayload = __commonJS({
  "node_modules/obscenity/dist/matcher/MatchPayload.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compareMatchByPositionAndId = void 0;
    var Interval_1 = require_Interval();
    function compareMatchByPositionAndId2(a, b) {
      const result = (0, Interval_1.compareIntervals)(a.startIndex, a.endIndex, b.startIndex, b.endIndex);
      if (result !== 0)
        return result;
      return a.termId === b.termId ? 0 : a.termId < b.termId ? -1 : 1;
    }
    exports.compareMatchByPositionAndId = compareMatchByPositionAndId2;
  }
});

// node_modules/obscenity/dist/censor/TextCensor.js
var require_TextCensor = __commonJS({
  "node_modules/obscenity/dist/censor/TextCensor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextCensor = void 0;
    var MatchPayload_1 = require_MatchPayload();
    var BuiltinStrategies_1 = require_BuiltinStrategies();
    var TextCensor2 = class {
      constructor() {
        this.strategy = (0, BuiltinStrategies_1.grawlixCensorStrategy)();
      }
      /**
       * Sets the censoring strategy, which is responsible for generating
       * replacement text for regions of the text that should be censored.
       *
       * The default censoring strategy is the [[grawlixCensorStrategy]],
       * generating text like `$%@*`. There are several other built-in strategies
       * available:
       * - [[keepStartCensorStrategy]] - extends another strategy and keeps the
       *   first character matched, e.g. `f***`.
       * - [[keepEndCensorStrategy]] - extends another strategy and keeps the last
       *   character matched, e.g. `***k`.
       * - [[asteriskCensorStrategy]] - replaces the text with asterisks, e.g.
       *   `****`.
       * - [[grawlixCensorStrategy]] - the default strategy, discussed earlier.
       *
       * Note that since censoring strategies are just functions (see the
       * documentation for [[TextCensorStrategy]]), it is relatively simple to
       * create your own.
       *
       * To ease creation of common censoring strategies, we provide a number of
       * utility functions:
       * - [[fixedPhraseCensorStrategy]] - generates a fixed phrase, e.g. `fudge`.
       * - [[fixedCharCensorStrategy]] - generates replacement strings constructed
       *   from the character given, repeated as many times as needed.
       * - [[randomCharFromSetCensorStrategy]] - generates replacement strings
       *   made up of random characters from the set of characters provided.
       *
       * @param strategy - Text censoring strategy to use.
       */
      setStrategy(strategy) {
        this.strategy = strategy;
        return this;
      }
      /**
       * Applies the censoring strategy to the text, returning the censored text.
       *
       * **Overlapping regions**
       *
       * Overlapping regions are an annoying edge case to deal with when censoring
       * text. There is no single best way to handle them, but the implementation
       * of this method guarantees that overlapping regions will always be
       * replaced, following the rules below:
       *
       * - Replacement text for matched regions will be generated in the order
       *   specified by [[compareMatchByPositionAndId]];
       * - When generating replacements for regions that overlap at the start with
       *   some other region, the start index of the censor context passed to the
       *   censoring strategy will be the end index of the first region, plus one.
       *
       * @param input - Input text.
       * @param matches - A list of matches.
       * @returns The censored text.
       */
      applyTo(input, matches) {
        if (matches.length === 0)
          return input;
        const sorted = [...matches].sort(MatchPayload_1.compareMatchByPositionAndId);
        let censored = "";
        let lastIndex = 0;
        for (let i = 0; i < sorted.length; i++) {
          const match = sorted[i];
          if (lastIndex > match.endIndex)
            continue;
          const overlapsAtStart = match.startIndex < lastIndex;
          if (!overlapsAtStart)
            censored += input.slice(lastIndex, match.startIndex);
          const actualStartIndex = Math.max(lastIndex, match.startIndex);
          const overlapsAtEnd = i < sorted.length - 1 && // not the last match
          match.endIndex >= sorted[i + 1].startIndex && // end index of this match and start index of next one overlap
          match.endIndex < sorted[i + 1].endIndex;
          censored += this.strategy({ ...match, startIndex: actualStartIndex, input, overlapsAtStart, overlapsAtEnd });
          lastIndex = match.endIndex + 1;
        }
        censored += input.slice(lastIndex);
        return censored;
      }
    };
    exports.TextCensor = TextCensor2;
  }
});

// node_modules/obscenity/dist/matcher/BlacklistedTerm.js
var require_BlacklistedTerm = __commonJS({
  "node_modules/obscenity/dist/matcher/BlacklistedTerm.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assignIncrementingIds = void 0;
    function assignIncrementingIds2(patterns) {
      let currentId = 0;
      return patterns.map((pattern2) => ({ id: currentId++, pattern: pattern2 }));
    }
    exports.assignIncrementingIds = assignIncrementingIds2;
  }
});

// node_modules/obscenity/dist/dataset/DataSet.js
var require_DataSet = __commonJS({
  "node_modules/obscenity/dist/dataset/DataSet.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PhraseBuilder = exports.DataSet = void 0;
    var BlacklistedTerm_1 = require_BlacklistedTerm();
    var DataSet2 = class {
      constructor() {
        this.containers = [];
        this.patternCount = 0;
        this.patternIdToPhraseContainer = /* @__PURE__ */ new Map();
      }
      /**
       * Adds all the phrases from the dataset provided to this one.
       *
       * @example
       * ```typescript
       * const customDataset = new DataSet().addAll(englishDataset);
       * ```
       * @param other - Other dataset.
       */
      addAll(other) {
        for (const container of other.containers)
          this.registerContainer(container);
        return this;
      }
      /**
       * Removes phrases that match the predicate given.
       *
       * @example
       * ```typescript
       * const customDataset = new DataSet<{ originalWord: string }>()
       * 	.addAll(englishDataset)
       * 	.removePhrasesIf((phrase) => phrase.metadata.originalWord === 'fuck');
       * ```
       * @param predicate - A predicate that determines whether or not a phrase should be removed.
       * Return `true` to remove, `false` to keep.
       */
      removePhrasesIf(predicate) {
        this.patternCount = 0;
        this.patternIdToPhraseContainer.clear();
        const containers = this.containers.splice(0);
        for (const container of containers) {
          const remove = predicate(container);
          if (!remove)
            this.registerContainer(container);
        }
        return this;
      }
      /**
       * Adds a phrase to this dataset.
       *
       * @example
       * ```typescript
       * const data = new DataSet<{ originalWord: string }>()
       * 	.addPhrase((phrase) => phrase.setMetadata({ originalWord: 'fuck' })
       * 		.addPattern(pattern`fuck`)
       * 		.addPattern(pattern`f[?]ck`)
       * 		.addWhitelistedTerm('Afck'))
       * 	.build();
       * ```
       * @param fn - A function that takes a [[PhraseBuilder]], adds
       * patterns/whitelisted terms/metadata to it, and returns it.
       */
      addPhrase(fn) {
        const container = fn(new PhraseBuilder2()).build();
        this.registerContainer(container);
        return this;
      }
      /**
       * Retrieves the phrase metadata associated with a pattern and returns a
       * copy of the match payload with said metadata attached to it.
       *
       * @example
       * ```typescript
       * const matches = matcher.getAllMatches(input);
       * const matchesWithPhraseMetadata = matches.map((match) => dataset.getPayloadWithPhraseMetadata(match));
       * // Now we can access the 'phraseMetadata' property:
       * const phraseMetadata = matchesWithPhraseMetadata[0].phraseMetadata;
       * ```
       * @param payload - Original match payload.
       */
      getPayloadWithPhraseMetadata(payload) {
        const offset = this.patternIdToPhraseContainer.get(payload.termId);
        if (offset === void 0) {
          throw new Error(`The pattern with ID ${payload.termId} does not exist in this dataset.`);
        }
        return {
          ...payload,
          phraseMetadata: this.containers[offset].metadata
        };
      }
      /**
       * Returns the dataset in a format suitable for usage with the [[RegExpMatcher]].
       *
       * @example
       * ```typescript
       * // With the RegExpMatcher:
       * const matcher = new RegExpMatcher({
       * 	...dataset.build(),
       * 	// additional options here
       * });
       * ```
       */
      build() {
        return {
          blacklistedTerms: (0, BlacklistedTerm_1.assignIncrementingIds)(this.containers.flatMap((p) => p.patterns)),
          whitelistedTerms: this.containers.flatMap((p) => p.whitelistedTerms)
        };
      }
      registerContainer(container) {
        const offset = this.containers.push(container) - 1;
        for (let i = 0, phraseId = this.patternCount; i < container.patterns.length; i++, phraseId++) {
          this.patternIdToPhraseContainer.set(phraseId, offset);
          this.patternCount++;
        }
      }
    };
    exports.DataSet = DataSet2;
    var PhraseBuilder2 = class {
      constructor() {
        this.patterns = [];
        this.whitelistedTerms = [];
      }
      /**
       * Associates a pattern with this phrase.
       *
       * @param pattern - Pattern to add.
       */
      addPattern(pattern2) {
        this.patterns.push(pattern2);
        return this;
      }
      /**
       * Associates a whitelisted pattern with this phrase.
       *
       * @param term - Whitelisted term to add.
       */
      addWhitelistedTerm(term) {
        this.whitelistedTerms.push(term);
        return this;
      }
      /**
       * Associates some metadata with this phrase.
       *
       * @param metadata - Metadata to use.
       */
      setMetadata(metadata) {
        this.metadata = metadata;
        return this;
      }
      /**
       * Builds the phrase, returning a [[PhraseContainer]] for use with the
       * [[DataSet]].
       */
      build() {
        return {
          patterns: this.patterns,
          whitelistedTerms: this.whitelistedTerms,
          metadata: this.metadata
        };
      }
    };
    exports.PhraseBuilder = PhraseBuilder2;
  }
});

// node_modules/obscenity/dist/pattern/Nodes.js
var require_Nodes = __commonJS({
  "node_modules/obscenity/dist/pattern/Nodes.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SyntaxKind = void 0;
    var SyntaxKind2;
    (function(SyntaxKind3) {
      SyntaxKind3[SyntaxKind3["Optional"] = 0] = "Optional";
      SyntaxKind3[SyntaxKind3["Wildcard"] = 1] = "Wildcard";
      SyntaxKind3[SyntaxKind3["Literal"] = 2] = "Literal";
      SyntaxKind3[SyntaxKind3["BoundaryAssertion"] = 3] = "BoundaryAssertion";
    })(SyntaxKind2 || (exports.SyntaxKind = SyntaxKind2 = {}));
  }
});

// node_modules/obscenity/dist/pattern/Util.js
var require_Util = __commonJS({
  "node_modules/obscenity/dist/pattern/Util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRegExpStringForNode = exports.compilePatternToRegExp = exports.potentiallyMatchesEmptyString = void 0;
    var Nodes_1 = require_Nodes();
    function potentiallyMatchesEmptyString(pattern2) {
      return pattern2.nodes.every((node) => node.kind === Nodes_1.SyntaxKind.Optional);
    }
    exports.potentiallyMatchesEmptyString = potentiallyMatchesEmptyString;
    function compilePatternToRegExp(pattern2) {
      let regExpStr = "";
      if (pattern2.requireWordBoundaryAtStart)
        regExpStr += "\\b";
      for (const node of pattern2.nodes)
        regExpStr += getRegExpStringForNode(node);
      if (pattern2.requireWordBoundaryAtEnd)
        regExpStr += `\\b`;
      return new RegExp(regExpStr, "gs");
    }
    exports.compilePatternToRegExp = compilePatternToRegExp;
    var regExpSpecialChars = ["[", ".", "*", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "\\", "]"].map((str) => str.charCodeAt(0));
    function getRegExpStringForNode(node) {
      switch (node.kind) {
        case Nodes_1.SyntaxKind.Literal: {
          let str = "";
          for (const char of node.chars) {
            if (regExpSpecialChars.includes(char))
              str += "\\";
            str += String.fromCodePoint(char);
          }
          return str;
        }
        case Nodes_1.SyntaxKind.Optional:
          return `(?:${getRegExpStringForNode(node.childNode)})?`;
        case Nodes_1.SyntaxKind.Wildcard:
          return `.`;
      }
    }
    exports.getRegExpStringForNode = getRegExpStringForNode;
  }
});

// node_modules/obscenity/dist/transformer/TransformerSet.js
var require_TransformerSet = __commonJS({
  "node_modules/obscenity/dist/transformer/TransformerSet.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TransformerSet = void 0;
    var TransformerSet = class {
      constructor(transformers) {
        this.transformers = transformers;
        this.statefulTransformers = Array.from({ length: this.transformers.length });
        for (let i = 0; i < this.transformers.length; i++) {
          const transformer = this.transformers[i];
          if (transformer.type === 1) {
            this.statefulTransformers[i] = transformer.factory();
          }
        }
      }
      applyTo(char) {
        let transformed = char;
        for (let i = 0; i < this.transformers.length && transformed !== void 0; i++) {
          const transformer = this.transformers[i];
          if (transformer.type === 0)
            transformed = transformer.transform(transformed);
          else
            transformed = this.statefulTransformers[i].transform(transformed);
        }
        return transformed;
      }
      resetAll() {
        for (let i = 0; i < this.transformers.length; i++) {
          if (this.transformers[i].type === 1) {
            this.statefulTransformers[i].reset();
          }
        }
      }
    };
    exports.TransformerSet = TransformerSet;
  }
});

// node_modules/obscenity/dist/util/CharacterIterator.js
var require_CharacterIterator = __commonJS({
  "node_modules/obscenity/dist/util/CharacterIterator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CharacterIterator = void 0;
    var Char_1 = require_Char();
    var CharacterIterator = class {
      constructor(input) {
        this.lastPosition = -1;
        this.currentPosition = 0;
        this._lastWidth = 0;
        this._input = input ?? "";
      }
      get input() {
        return this._input;
      }
      setInput(input) {
        this._input = input;
        this.reset();
        return this;
      }
      reset() {
        this.lastPosition = -1;
        this.currentPosition = 0;
        this._lastWidth = 0;
      }
      next() {
        if (this.done)
          return { done: true, value: void 0 };
        this.lastPosition = this.currentPosition;
        const char = this._input.charCodeAt(this.currentPosition++);
        this._lastWidth = 1;
        if (this.done || !(0, Char_1.isHighSurrogate)(char))
          return { done: false, value: char };
        const next = this._input.charCodeAt(this.currentPosition);
        if ((0, Char_1.isLowSurrogate)(next)) {
          this._lastWidth++;
          this.currentPosition++;
          return { done: false, value: (0, Char_1.convertSurrogatePairToCodePoint)(char, next) };
        }
        return { done: false, value: char };
      }
      // Position of the iterator; equals the start index of the last character consumed.
      // -1 if no characters were consumed yet.
      get position() {
        return this.lastPosition;
      }
      // Width of the last character consumed; 2 if it was a surrogate pair and 1 otherwise.
      // 0 if no characters were consumed yet.
      get lastWidth() {
        return this._lastWidth;
      }
      get done() {
        return this.currentPosition >= this._input.length;
      }
      [Symbol.iterator]() {
        return this;
      }
    };
    exports.CharacterIterator = CharacterIterator;
  }
});

// node_modules/obscenity/dist/matcher/IntervalCollection.js
var require_IntervalCollection = __commonJS({
  "node_modules/obscenity/dist/matcher/IntervalCollection.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntervalCollection = void 0;
    var IntervalCollection = class {
      constructor() {
        this.dirty = false;
        this.intervals = [];
      }
      insert(lowerBound, upperBound) {
        this.intervals.push([lowerBound, upperBound]);
        this.dirty = true;
      }
      query(lowerBound, upperBound) {
        if (this.intervals.length === 0)
          return false;
        if (this.dirty) {
          this.dirty = false;
          this.intervals.sort(
            /* istanbul ignore next: not possible to write a robust test for this */
            (a, b) => a[0] < b[0] ? -1 : b[0] < a[0] ? 1 : 0
          );
        }
        for (const interval of this.intervals) {
          if (interval[0] > lowerBound)
            break;
          if (interval[0] <= lowerBound && upperBound <= interval[1])
            return true;
        }
        return false;
      }
      values() {
        return this.intervals.values();
      }
      [Symbol.iterator]() {
        return this.values();
      }
    };
    exports.IntervalCollection = IntervalCollection;
  }
});

// node_modules/obscenity/dist/matcher/regexp/RegExpMatcher.js
var require_RegExpMatcher = __commonJS({
  "node_modules/obscenity/dist/matcher/regexp/RegExpMatcher.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RegExpMatcher = void 0;
    var Char_1 = require_Char();
    var Util_1 = require_Util();
    var TransformerSet_1 = require_TransformerSet();
    var CharacterIterator_1 = require_CharacterIterator();
    var IntervalCollection_1 = require_IntervalCollection();
    var MatchPayload_1 = require_MatchPayload();
    var RegExpMatcher2 = class {
      /**
       * Creates a new [[RegExpMatcher]] with the options given.
       *
       * @example
       * ```typescript
       * // Use the options provided by the English preset.
       * const matcher = new RegExpMatcher({
       * 	...englishDataset.build(),
       * 	...englishRecommendedTransformers,
       * });
       * ```
       * @example
       * ```typescript
       * // Simple matcher that only has blacklisted patterns.
       * const matcher = new RegExpMatcher({
       *  blacklistedTerms: assignIncrementingIds([
       *      pattern`fuck`,
       *      pattern`f?uck`, // wildcards (?)
       *      pattern`bitch`,
       *      pattern`b[i]tch` // optionals ([i] matches either "i" or "")
       *  ]),
       * });
       *
       * // Check whether some string matches any of the patterns.
       * const doesMatch = matcher.hasMatch('fuck you bitch');
       * ```
       * @example
       * ```typescript
       * // A more advanced example, with transformers and whitelisted terms.
       * const matcher = new RegExpMatcher({
       *  blacklistedTerms: [
       *      { id: 1, pattern: pattern`penis` },
       *      { id: 2, pattern: pattern`fuck` },
       *  ],
       *  whitelistedTerms: ['pen is'],
       *  blacklistMatcherTransformers: [
       *      resolveConfusablesTransformer(), // '🅰' => 'a'
       *      resolveLeetSpeakTransformer(), // '$' => 's'
       *      foldAsciiCharCaseTransformer(), // case insensitive matching
       *      skipNonAlphabeticTransformer(), // 'f.u...c.k' => 'fuck'
       *      collapseDuplicatesTransformer(), // 'aaaa' => 'a'
       *  ],
       * });
       *
       * // Output all matches.
       * console.log(matcher.getAllMatches('fu.....uuuuCK the pen is mightier than the sword!'));
       * ```
       * @param options - Options to use.
       */
      constructor({ blacklistedTerms, whitelistedTerms = [], blacklistMatcherTransformers = [], whitelistMatcherTransformers = [] }) {
        this.blacklistedTerms = this.compileTerms(blacklistedTerms);
        this.validateWhitelistedTerms(whitelistedTerms);
        this.whitelistedTerms = whitelistedTerms;
        this.blacklistMatcherTransformers = new TransformerSet_1.TransformerSet(blacklistMatcherTransformers);
        this.whitelistMatcherTransformers = new TransformerSet_1.TransformerSet(whitelistMatcherTransformers);
      }
      getAllMatches(input, sorted = false) {
        const whitelistedIntervals = this.getWhitelistedIntervals(input);
        const [transformedToOrigIndex, transformed] = this.applyTransformers(input, this.blacklistMatcherTransformers);
        const matches = [];
        for (const blacklistedTerm of this.blacklistedTerms) {
          for (const match of transformed.matchAll(blacklistedTerm.regExp)) {
            const origStartIndex = transformedToOrigIndex[match.index];
            let origEndIndex = transformedToOrigIndex[match.index + match[0].length - 1];
            if (origEndIndex < input.length - 1 && // not the last character
            (0, Char_1.isHighSurrogate)(input.charCodeAt(origEndIndex)) && // character is a high surrogate
            (0, Char_1.isLowSurrogate)(input.charCodeAt(origEndIndex + 1))) {
              origEndIndex++;
            }
            if (!whitelistedIntervals.query(origStartIndex, origEndIndex)) {
              matches.push({
                termId: blacklistedTerm.id,
                startIndex: origStartIndex,
                endIndex: origEndIndex,
                matchLength: [...match[0]].length
              });
            }
          }
        }
        if (sorted)
          matches.sort(MatchPayload_1.compareMatchByPositionAndId);
        return matches;
      }
      hasMatch(input) {
        const whitelistedIntervals = this.getWhitelistedIntervals(input);
        const [transformedToOrigIndex, transformed] = this.applyTransformers(input, this.blacklistMatcherTransformers);
        for (const blacklistedTerm of this.blacklistedTerms) {
          for (const match of transformed.matchAll(blacklistedTerm.regExp)) {
            const origStartIndex = transformedToOrigIndex[match.index];
            let origEndIndex = transformedToOrigIndex[match.index + match[0].length - 1];
            if (origEndIndex < input.length - 1 && // not the last character
            (0, Char_1.isHighSurrogate)(input.charCodeAt(origEndIndex)) && // character is a high surrogate
            (0, Char_1.isLowSurrogate)(input.charCodeAt(origEndIndex + 1))) {
              origEndIndex++;
            }
            if (!whitelistedIntervals.query(origStartIndex, origEndIndex))
              return true;
          }
        }
        return false;
      }
      getWhitelistedIntervals(input) {
        const matches = new IntervalCollection_1.IntervalCollection();
        const [transformedToOrigIndex, transformed] = this.applyTransformers(input, this.whitelistMatcherTransformers);
        for (const whitelistedTerm of this.whitelistedTerms) {
          let lastEnd = 0;
          for (let startIndex = transformed.indexOf(whitelistedTerm, lastEnd); startIndex !== -1; startIndex = transformed.indexOf(whitelistedTerm, lastEnd)) {
            let origEndIndex = transformedToOrigIndex[startIndex + whitelistedTerm.length - 1];
            if (origEndIndex < input.length - 1 && // not the last character
            (0, Char_1.isHighSurrogate)(input.charCodeAt(origEndIndex)) && // character is a high surrogate
            (0, Char_1.isLowSurrogate)(input.charCodeAt(origEndIndex + 1))) {
              origEndIndex++;
            }
            matches.insert(transformedToOrigIndex[startIndex], origEndIndex);
            lastEnd = startIndex + whitelistedTerm.length;
          }
        }
        return matches;
      }
      applyTransformers(input, transformers) {
        const transformedToOrigIndex = [];
        let transformed = "";
        const iter = new CharacterIterator_1.CharacterIterator(input);
        for (const char of iter) {
          const transformedChar = transformers.applyTo(char);
          if (transformedChar !== void 0) {
            transformed += String.fromCodePoint(transformedChar);
            while (transformedToOrigIndex.length < transformed.length)
              transformedToOrigIndex.push(iter.position);
          }
        }
        transformers.resetAll();
        return [transformedToOrigIndex, transformed];
      }
      compileTerms(terms) {
        const compiled = [];
        const seenIds = /* @__PURE__ */ new Set();
        for (const term of terms) {
          if (seenIds.has(term.id))
            throw new Error(`Duplicate blacklisted term ID ${term.id}.`);
          if ((0, Util_1.potentiallyMatchesEmptyString)(term.pattern)) {
            throw new Error(`Pattern with ID ${term.id} potentially matches empty string; this is unsupported.`);
          }
          compiled.push({
            id: term.id,
            regExp: (0, Util_1.compilePatternToRegExp)(term.pattern)
          });
          seenIds.add(term.id);
        }
        return compiled;
      }
      validateWhitelistedTerms(whitelist) {
        if (whitelist.some((term) => term.length === 0)) {
          throw new Error("Whitelisted term set contains empty string; this is unsupported.");
        }
      }
    };
    exports.RegExpMatcher = RegExpMatcher2;
  }
});

// node_modules/obscenity/dist/matcher/Matcher.js
var require_Matcher = __commonJS({
  "node_modules/obscenity/dist/matcher/Matcher.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/obscenity/dist/pattern/ParserError.js
var require_ParserError = __commonJS({
  "node_modules/obscenity/dist/pattern/ParserError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParserError = void 0;
    var ParserError2 = class extends Error {
      constructor(message, line, column) {
        super(`${line}:${column}: ${message}`);
        this.name = "ParserError";
        this.line = line;
        this.column = column;
      }
    };
    exports.ParserError = ParserError2;
  }
});

// node_modules/obscenity/dist/pattern/Parser.js
var require_Parser = __commonJS({
  "node_modules/obscenity/dist/pattern/Parser.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = void 0;
    var Char_1 = require_Char();
    var CharacterIterator_1 = require_CharacterIterator();
    var Nodes_1 = require_Nodes();
    var ParserError_1 = require_ParserError();
    var supportsEscaping = [
      92,
      91,
      93,
      63,
      124
    ];
    var supportsEscapingList = supportsEscaping.map((char) => `'${String.fromCodePoint(char)}'`).join(", ");
    var eof = -1;
    var Parser = class {
      constructor() {
        this.input = "";
        this.line = 1;
        this.column = 1;
        this.position = 0;
        this.lastColumn = 1;
        this.lastWidth = 0;
      }
      parse(input) {
        this.setInput(input);
        const nodes = [];
        const firstNode = this.nextNode();
        const requireWordBoundaryAtStart = (firstNode == null ? void 0 : firstNode.kind) === Nodes_1.SyntaxKind.BoundaryAssertion;
        if (firstNode && !requireWordBoundaryAtStart)
          nodes.push(firstNode);
        let requireWordBoundaryAtEnd = false;
        while (!this.done) {
          const pos = this.mark();
          const node = this.nextNode();
          if (node.kind !== Nodes_1.SyntaxKind.BoundaryAssertion) {
            nodes.push(node);
            continue;
          }
          if (!this.done) {
            this.reportError("Boundary assertions are not supported in this position; they are only allowed at the start / end of the pattern.", pos);
          }
          requireWordBoundaryAtEnd = true;
        }
        return { requireWordBoundaryAtStart, requireWordBoundaryAtEnd, nodes };
      }
      setInput(input) {
        this.input = input;
        this.line = 1;
        this.column = 1;
        this.position = 0;
        this.lastColumn = 1;
        this.lastWidth = 0;
        return this;
      }
      nextNode() {
        switch (this.peek()) {
          case eof:
            return void 0;
          case 91:
            return this.parseOptional();
          case 93:
            this.reportError(`Unexpected ']' with no corresponding '['.`);
          // eslint-disable-next-line no-fallthrough
          case 63:
            return this.parseWildcard();
          case 124:
            return this.parseBoundaryAssertion();
          default:
            return this.parseLiteral();
        }
      }
      get done() {
        return this.position >= this.input.length;
      }
      // Optional ::= '[' Wildcard | Text ']'
      parseOptional() {
        const preOpenBracketPos = this.mark();
        this.next();
        const postOpenBracketPos = this.mark();
        if (this.done)
          this.reportError("Unexpected unclosed '['.", preOpenBracketPos);
        if (this.accept("["))
          this.reportError("Unexpected nested optional node.", postOpenBracketPos);
        const childNode = this.nextNode();
        if (childNode.kind === Nodes_1.SyntaxKind.BoundaryAssertion) {
          this.reportError("Boundary assertions are not supported in this position; they are only allowed at the start / end of the pattern.", postOpenBracketPos);
        }
        if (!this.accept("]"))
          this.reportError("Unexpected unclosed '['.");
        return { kind: Nodes_1.SyntaxKind.Optional, childNode };
      }
      // Wildcard ::= '?'
      parseWildcard() {
        this.next();
        return { kind: Nodes_1.SyntaxKind.Wildcard };
      }
      // BoundaryAssertion ::= '|'
      parseBoundaryAssertion() {
        this.next();
        return { kind: Nodes_1.SyntaxKind.BoundaryAssertion };
      }
      // Literal              ::= (NON_SPECIAL | '\' SUPPORTS_ESCAPING)+
      // NON_SPECIAL         ::= _any character other than '\', '?', '[', ']', or '|'_
      // SUPPORTS_ESCAPING   ::= '\' | '[' | ']' | '?' | '|'
      parseLiteral() {
        const chars = [];
        while (!this.done) {
          if (this.accept("[]?|")) {
            this.backup();
            break;
          }
          const next = this.next();
          if (next === 92) {
            if (this.done) {
              this.backup();
              this.reportError("Unexpected trailing backslash.");
            }
            const escaped = this.next();
            if (!supportsEscaping.includes(escaped)) {
              const repr = String.fromCodePoint(escaped);
              this.backup();
              this.reportError(`Cannot escape character '${repr}'; the only characters that can be escaped are the following: ${supportsEscapingList}.`);
            }
            chars.push(escaped);
          } else {
            chars.push(next);
          }
        }
        return { kind: Nodes_1.SyntaxKind.Literal, chars };
      }
      reportError(message, { line = this.line, column = this.column } = {}) {
        throw new ParserError_1.ParserError(message, line, column);
      }
      // Marks the current position.
      mark() {
        return { line: this.line, column: this.column };
      }
      // Accepts any code point in the charset provided. Iff accepted, the character is consumed.
      accept(charset) {
        const next = this.next();
        const iter = new CharacterIterator_1.CharacterIterator(charset);
        for (const char of iter) {
          if (char === next)
            return true;
        }
        this.backup();
        return false;
      }
      // Reads one code point from the input, without consuming it.
      peek() {
        const next = this.next();
        this.backup();
        return next;
      }
      // Consumes one code point from the input.
      next() {
        if (this.done)
          return eof;
        const char = this.input.charCodeAt(this.position++);
        this.lastWidth = 1;
        if (char === 10) {
          this.lastColumn = this.column;
          this.column = 1;
          this.line++;
          return char;
        }
        this.lastColumn = this.column++;
        if (!(0, Char_1.isHighSurrogate)(char) || this.done)
          return char;
        const next = this.input.charCodeAt(this.position);
        if ((0, Char_1.isLowSurrogate)(next)) {
          this.position++;
          this.lastWidth++;
          return (0, Char_1.convertSurrogatePairToCodePoint)(char, next);
        }
        return char;
      }
      // Steps back one character; can only be called once per call to next().
      backup() {
        this.position -= this.lastWidth;
        this.column = this.lastColumn;
        if (this.lastWidth === 1 && this.input.charCodeAt(this.position) === 10) {
          this.line--;
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/obscenity/dist/pattern/Pattern.js
var require_Pattern = __commonJS({
  "node_modules/obscenity/dist/pattern/Pattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseRawPattern = exports.pattern = void 0;
    var Parser_1 = require_Parser();
    var parser = new Parser_1.Parser();
    function pattern2(strings, ...expressions) {
      let result = strings.raw[0];
      for (const [i, expression] of expressions.entries()) {
        result += expression;
        result += strings.raw[i + 1];
      }
      return parser.parse(result);
    }
    exports.pattern = pattern2;
    function parseRawPattern2(pattern3) {
      return parser.parse(pattern3);
    }
    exports.parseRawPattern = parseRawPattern2;
  }
});

// node_modules/obscenity/dist/transformer/Transformers.js
var require_Transformers = __commonJS({
  "node_modules/obscenity/dist/transformer/Transformers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createStatefulTransformer = exports.createSimpleTransformer = void 0;
    function createSimpleTransformer(transformer) {
      return { type: 0, transform: transformer };
    }
    exports.createSimpleTransformer = createSimpleTransformer;
    function createStatefulTransformer(factory) {
      return { type: 1, factory };
    }
    exports.createStatefulTransformer = createStatefulTransformer;
  }
});

// node_modules/obscenity/dist/transformer/collapse-duplicates/transformer.js
var require_transformer = __commonJS({
  "node_modules/obscenity/dist/transformer/collapse-duplicates/transformer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollapseDuplicatesTransformer = void 0;
    var CollapseDuplicatesTransformer = class {
      constructor({ defaultThreshold, customThresholds }) {
        this.remaining = -1;
        this.lastChar = -1;
        this.defaultThreshold = defaultThreshold;
        this.customThresholds = customThresholds;
      }
      transform(char) {
        if (char === this.lastChar) {
          return this.remaining-- > 0 ? char : void 0;
        }
        const threshold = this.customThresholds.get(char) ?? this.defaultThreshold;
        this.remaining = threshold - 1;
        this.lastChar = char;
        return threshold > 0 ? char : void 0;
      }
      reset() {
        this.remaining = -1;
        this.lastChar = -1;
      }
    };
    exports.CollapseDuplicatesTransformer = CollapseDuplicatesTransformer;
  }
});

// node_modules/obscenity/dist/transformer/collapse-duplicates/index.js
var require_collapse_duplicates = __commonJS({
  "node_modules/obscenity/dist/transformer/collapse-duplicates/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.collapseDuplicatesTransformer = void 0;
    var Char_1 = require_Char();
    var Transformers_1 = require_Transformers();
    var transformer_1 = require_transformer();
    function collapseDuplicatesTransformer2({ defaultThreshold = 1, customThresholds = /* @__PURE__ */ new Map() } = {}) {
      const map = createCharacterToThresholdMap(customThresholds);
      return (0, Transformers_1.createStatefulTransformer)(() => new transformer_1.CollapseDuplicatesTransformer({ defaultThreshold, customThresholds: map }));
    }
    exports.collapseDuplicatesTransformer = collapseDuplicatesTransformer2;
    function createCharacterToThresholdMap(customThresholds) {
      const map = /* @__PURE__ */ new Map();
      for (const [str, threshold] of customThresholds) {
        if (threshold < 0)
          throw new RangeError("Expected all thresholds to be non-negative.");
        const char = (0, Char_1.getAndAssertSingleCodePoint)(str);
        map.set(char, threshold);
      }
      return map;
    }
  }
});

// node_modules/obscenity/dist/transformer/remap-characters/index.js
var require_remap_characters = __commonJS({
  "node_modules/obscenity/dist/transformer/remap-characters/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.remapCharactersTransformer = void 0;
    var Char_1 = require_Char();
    var CharacterIterator_1 = require_CharacterIterator();
    var Transformers_1 = require_Transformers();
    function remapCharactersTransformer2(mapping) {
      const map = createOneToOneMap(mapping);
      return (0, Transformers_1.createSimpleTransformer)((c) => map.get(c) ?? c);
    }
    exports.remapCharactersTransformer = remapCharactersTransformer2;
    function createOneToOneMap(mapping) {
      const map = /* @__PURE__ */ new Map();
      const iterable = mapping instanceof Map ? mapping.entries() : Object.entries(mapping);
      for (const [original, equivalents] of iterable) {
        const originalChar = (0, Char_1.getAndAssertSingleCodePoint)(original);
        const iter = new CharacterIterator_1.CharacterIterator(equivalents);
        for (const equivalent of iter)
          map.set(equivalent, originalChar);
      }
      return map;
    }
  }
});

// node_modules/obscenity/dist/transformer/resolve-confusables/confusables.js
var require_confusables = __commonJS({
  "node_modules/obscenity/dist/transformer/resolve-confusables/confusables.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.confusables = void 0;
    exports.confusables = /* @__PURE__ */ new Map([
      [" ", " "],
      ["0", "⓿"],
      ["1", "⓵➊⑴¹𝟏𝟙１𝟷𝟣⒈𝟭1➀₁①❶⥠"],
      ["2", "⓶⒉⑵➋ƻ²ᒿ𝟚２𝟮𝟤ᒾ𝟸Ƨ𝟐②ᴤ₂➁❷ᘝƨ"],
      ["3", "³ⳌꞫ𝟑ℨ𝟛𝟯𝟥Ꝫ➌ЗȜ⓷ӠƷ３𝟹⑶⒊ʒʓǯǮƺ𝕴ᶾзᦡ➂③₃ᶚᴣᴟ❸ҘҙӬӡӭӟӞ"],
      ["4", "➍ҶᏎ𝟜ҷ⓸ҸҹӴӵᶣ４чㄩ⁴➃₄④❹Ӌ⑷⒋"],
      ["5", "𝟱⓹➎Ƽ𝟓𝟻𝟝𝟧５➄₅⑤⁵❺ƽ⑸⒌"],
      ["6", "ⳒᏮ𝟞𝟨𝟔➏⓺Ϭϭ⁶б６ᧈ⑥➅₆❻⑹⒍"],
      ["7", "⓻𐓒➐７⁷⑦₇❼➆⑺⒎"],
      ["8", "𐌚➑⓼８𝟠𝟪৪⁸₈𝟴➇⑧❽𝟾𝟖⑻⒏"],
      ["9", "ꝮⳊ⓽➒੧৭୨９𝟫𝟿𝟗⁹₉Գ➈⑨❾⑼⒐"],
      ["A", "🄰Ꭿ𐊠𝕬𝜜𝐴ꓮᎪ𝚨ꭺ𝝖🅐Å∀🇦₳🅰𝒜𝘈𝐀𝔸дǺᗅⒶＡΑᾋᗩĂÃÅǍȀȂĀȺĄʌΛλƛᴀᴬДАልÄₐᕱªǞӒΆẠẢẦẨẬẮẰẲẴẶᾸᾹᾺΆᾼᾈᾉᾊᾌᾍᾎᾏἈἉἊἋἌἍἎἏḀȦǠӐÀÁÂẤẪ𝛢𝓐𝙰𝘼"],
      ["a", "∂⍺ⓐձǟᵃᶏ⒜аɒａαȃȁคǎმäɑāɐąᾄẚạảǡầẵḁȧӑӓãåάὰάăẩằẳặᾀᾁᾂᾃᾅᾆᾰᾱᾲᾳᾴᶐᾶᾷἀἁἂἃἄἅἆἇᾇậắàáâấẫǻⱥ𝐚𝑎𝒂𝒶𝓪𝔞𝕒𝖆𝖺𝗮𝘢𝙖𝚊𝛂𝛼𝜶𝝰𝞪⍶"],
      ["B", "𐌁𝑩𝕭🄱𐊡𝖡𝘽ꓐ𝗕𝘉𝜝𐊂𝚩𝐁𝛣𝝗𝐵𝙱𝔹Ᏼᏼ𝞑Ꞵ𝔅🅑฿𝓑ᗿᗾᗽ🅱ⒷＢвϐᗷƁ乃ßცჩ๖βɮБՅ๒ᙖʙᴮᵇጌḄℬΒВẞḂḆɃദᗹᗸᵝᙞᙟᙝᛒᙗᙘᴃ🇧"],
      ["b", "Ꮟ𝐛𝘣𝒷𝔟𝓫𝖇𝖻𝑏𝙗𝕓𝒃𝗯𝚋♭ᑳᒈｂᖚᕹᕺⓑḃḅҍъḇƃɓƅᖯƄЬᑲþƂ⒝ЪᶀᑿᒀᒂᒁᑾьƀҌѢѣᔎ"],
      ["C", "ᏟⲤ🄲ꓚ𐊢𐌂🅲𐐕🅒☾ČÇⒸＣↃƇᑕㄈ¢८↻ĈϾՇȻᙅᶜ⒞ĆҀĊ©टƆℂℭϹС匚ḈҪʗᑖᑡᑢᑣᑤᑥⅭ𝐂𝐶𝑪𝒞𝓒𝕮𝖢𝗖𝘊𝘾ᔍ"],
      ["c", "ⲥ𐐽ꮯĉｃⓒćčċçҁƈḉȼↄсርᴄϲҫ꒝ςɽϛ𝙲ᑦ᧚𝐜𝑐𝒄𝒸𝓬𝔠𝕔𝖈𝖼𝗰𝘤𝙘𝚌₵🇨ᥴᒼⅽ"],
      ["D", "Ꭰ🄳𝔡𝖉𝔻𝗗𝘋𝙳𝐷𝓓𝐃𝑫𝕯𝖣𝔇𝘿ꭰⅅ𝒟ꓓ🅳🅓ⒹＤƉᗪƊÐԺᴅᴰↁḊĐÞⅮᗞᑯĎḌḐḒḎᗫᗬᗟᗠᶛᴆ🇩"],
      ["d", "Ꮷꓒ𝓭ᵭ₫ԃⓓｄḋďḍḑḓḏđƌɖɗᵈ⒟ԁⅾᶁԀᑺᑻᑼᑽᒄᑰᑱᶑ𝕕𝖽𝑑𝘥𝒅𝙙𝐝𝗱𝚍ⅆ𝒹ʠժ"],
      ["E", "ꭼ🄴𝙀𝔼𐊆𝚬ꓰ𝝚𝞔𝓔𝑬𝗘🅴🅔ⒺΈＥƎἝᕮƐモЄᴇᴱᵉÉ乇ЁɆꂅ€ÈℰΕЕⴹᎬĒĔĖĘĚÊËԐỀẾỄỂẼḔḖẺȄȆẸỆȨḜḘḚἘἙἚἛἜῈΈӖὲέЀϵ🇪"],
      ["e", "𝑒𝓮𝕖𝖊𝘦𝗲𝚎𝙚𝒆𝔢𝖾𝐞Ҿҿⓔｅ⒠èᧉéᶒêɘἔềếễ૯ǝєεēҽɛểẽḕḗĕėëẻěȅȇẹệȩɇₑęḝḙḛ℮еԑѐӗᥱёἐἑἒἓἕℯ"],
      ["F", "🄵𐊇𝔉𝘍𐊥ꓝꞘ🅵🅕𝓕ⒻＦғҒᖴƑԲϝቻḞℱϜ₣🇫Ⅎ"],
      ["f", "𝐟𝖋ⓕｆƒḟʃբᶠ⒡ſꊰʄ∱ᶂ𝘧"],
      ["G", "ꓖᏳ🄶Ꮐᏻ𝔾𝓖𝑮𝕲ꮐ𝒢𝙂𝖦𝙶𝔊𝐺𝐆🅶🅖ⒼＧɢƓʛĢᘜᴳǴĠԌĜḠĞǦǤԍ₲🇬⅁"],
      ["g", "ⓖｇǵĝḡğġǧģց૭ǥɠﻭﻮᵍ⒢ℊɡᧁ𝐠𝑔𝒈𝓰𝔤𝕘𝖌𝗀𝗴𝘨𝙜𝚐"],
      ["H", "🄷𝜢ꓧ𝘏𝐻𝝜𝖧𐋏𝗛ꮋℍᎻℌⲎ𝑯𝞖🅷🅗ዞǶԋⒽＨĤᚺḢḦȞḤḨḪĦⱧҢңҤῊΉῌἨἩἪἫἭἮἯᾘᾙᾚᾛᾜᾝᾞᾟӉӈҥΉн卄♓𝓗ℋН𝐇𝙃𝙷ʜ𝛨Η𝚮ᕼӇᴴᵸ🇭"],
      ["h", "Һ⒣ђⓗｈĥḣḧȟḥḩḫẖħⱨհһከኩኪካɦℎ𝐡𝒉𝒽𝓱𝔥𝕙𝖍𝗁𝗵𝘩𝙝𝚑իʰᑋᗁɧんɥ"],
      ["I", "🄸ЇꀤᏆ🅸🅘إﺇٳأﺃٲٵⒾＩ៸ÌÍÎĨĪĬİÏḮỈǏȈȊỊĮḬƗェエῘῙῚΊἸἹἺἻἼἽἾⅠΪΊɪᶦᑊᥣ𝛪𝐈𝙄𝙸𝓵𝙡𝐼ᴵ𝚰𝑰🇮"],
      ["i", "ⓘｉìíîĩīĭïḯỉǐȉȋịḭῐῑῒΐῖῗἰἱἲⅰⅼ∣ⵏ￨׀ا١۱ߊᛁἳἴἵɨіὶίᶖ𝔦𝚒𝝸𝗂𝐢𝕚𝖎𝗶𝘪𝙞ίⁱᵢ𝓲⒤"],
      ["J", "🄹🅹🅙ⒿＪЈʝᒍנﾌĴʆวلյʖᴊᴶﻝጋɈⱼՂๅႱįᎫȷ丿ℐℑᒘᒙᒚᒛᒴᒵᒎᒏ🇯"],
      ["j", "ⓙｊϳʲ⒥ɉĵǰјڶᶨ𝒿𝘫𝗷𝑗𝙟𝔧𝒋𝗃𝓳𝕛𝚓𝖏𝐣"],
      ["K", "𝗞🄺𝜥𝘒ꓗ𝙆𝕂Ⲕ𝔎𝛫Ꮶ𝞙𝒦🅺🅚₭ⓀＫĸḰќƘкҠκқҟӄʞҚКҡᴋᴷᵏ⒦ᛕЌጕḲΚKҜҝҞĶḴǨⱩϗӃ🇰"],
      ["k", "ⓚｋḱǩḳķḵƙⱪᶄ𝐤𝘬𝗄𝕜𝜅𝜘𝜿𝝒𝝹𝞌𝞳𝙠𝚔𝑘𝒌ϰ𝛋𝛞𝟆𝗸𝓴𝓀"],
      ["L", "🄻𐐛Ⳑ𝑳𝙻𐑃𝓛ⳑꮮᏞꓡ🅻🅛ﺈ└ⓁւＬĿᒪ乚ՆʟꓶιԼᴸˡĹረḶₗΓլĻᄂⅬℒⱢᥧᥨᒻᒶᒷᶫﺎᒺᒹᒸᒫ⎳ㄥŁⱠﺄȽ🇱"],
      ["l", "ⓛｌŀĺľḷḹļӀℓḽḻłﾚɭƚɫⱡ|Ɩ⒧ʅǀוןΙІ｜ᶩӏ𝓘𝕀𝖨𝗜𝘐𝐥𝑙𝒍𝓁𝔩𝕝𝖑𝗅𝗹𝘭𝚕𝜤𝝞ı𝚤ɩι𝛊𝜄𝜾𝞲"],
      ["M", "🄼𐌑𐊰ꓟⲘᎷ🅼🅜ⓂＭмṂ൱ᗰ州ᘻო๓♏ʍᙏᴍᴹᵐ⒨ḾМṀ௱ⅯℳΜϺᛖӍӎ𝐌𝑀𝑴𝓜𝔐𝕄𝕸𝖬𝗠𝘔𝙈𝙼𝚳𝛭𝜧𝝡𝞛🇲"],
      ["m", "₥ᵯ𝖒𝐦𝗆𝔪𝕞𝓂ⓜｍനᙢ൩ḿṁⅿϻṃጠɱ៳ᶆ𝙢𝓶𝚖𝑚𝗺᧕᧗"],
      ["N", "🄽ℕꓠ𝛮𝝢𝙽𝚴𝑵𝑁Ⲛ𝐍𝒩𝞜𝗡𝘕𝜨𝓝𝖭🅽₦🅝ЙЍⓃҋ៷ＮᴎɴƝᑎ几иՈռИהЛπᴺᶰŃ刀ክṄⁿÑПΝᴨոϖǸŇṆŅṊṈทŊӢӣӤӥћѝйᥢҊᴻ🇳"],
      ["n", "ח𝒏𝓷𝙣𝑛𝖓𝔫𝗇𝚗𝗻ᥒⓝήｎǹᴒńñᾗηṅňṇɲņṋṉղຖՌƞŋ⒩ภกɳпŉлԉȠἠἡῃդᾐᾑᾒᾓᾔᾕᾖῄῆῇῂἢἣἤἥἦἧὴήበቡቢባቤብቦȵ𝛈𝜂𝜼𝝶𝞰𝕟𝘯𝐧𝓃ᶇᵰᥥ∩"],
      [
        "O",
        "ꄲ🄾𐊒𝟬ꓳⲞ𐐄𐊫𐓂𝞞🅞⍥◯ⵁ⊖０⊝𝝤Ѳϴ𝚶𝜪ѺӦӨӪΌʘ𝐎ǑÒŎÓÔÕȌȎㇿ❍ⓄＯὋロ❤૦⊕ØФԾΘƠᴼᵒ⒪ŐÖₒ¤◊Φ〇ΟОՕଠഠ௦סỒỐỖỔṌȬṎŌṐṒȮȰȪỎỜỚỠỞỢỌỘǪǬǾƟⵔ߀៰⍜⎔⎕⦰⦱⦲⦳⦴⦵⦶⦷⦸⦹⦺⦻⦼⦽⦾⦿⧀⧁⧂⧃ὈὉὊὌὍ"
      ],
      [
        "o",
        "𝚘𝛐𝗈𝞼ဝⲟ𝙤၀𐐬𝔬𐓪𝓸🇴⍤○ϙ🅾𝒪𝖮𝟢𝟶𝙾𝘰𝗼𝕠𝜊𝐨𝝾𝞸ᐤⓞѳ᧐ᥲðｏఠᦞՓòөӧóºōôǒȏŏồốȍỗổõσṍȭṏὄṑṓȯȫ๏ᴏőöѻоዐǭȱ০୦٥౦೦൦๐໐οօᴑ०੦ỏơờớỡởợọộǫøǿɵծὀὁόὸόὂὃὅ"
      ],
      ["P", "🄿ꓑ𝚸𝙿𝞠𝙋ꮲⲢ𝒫𝝦𝑃𝑷𝗣𝐏𐊕𝜬𝘗𝓟𝖯𝛲Ꮲ🅟Ҏ🅿ⓅＰƤᑭ尸Ṗրφքᴘᴾᵖ⒫ṔｱקРየᴩⱣℙΡῬᑸᑶᑷᑹᑬᑮ🇵₱"],
      ["p", "ҏ℗ⓟｐṕṗƥᵽῥρрƿǷῤ⍴𝓹𝓅𝐩𝑝𝒑𝔭𝕡𝖕𝗉𝗽𝘱𝙥𝚙𝛒𝝆𝞺𝜌𝞀"],
      ["Q", "🅀🆀🅠ⓆＱℚⵕԚ𝐐𝑄𝑸𝒬𝓠𝚀𝘘𝙌𝖰𝕼𝔔𝗤🇶"],
      ["q", "ⓠｑգ⒬۹զᑫɋɊԛ𝗊𝑞𝘲𝕢𝚚𝒒𝖖𝐪𝔮𝓺𝙦"],
      ["R", "℞℟ꭱᏒ𐒴ꮢᎡꓣ🆁🅡ⓇＲᴙȒʀᖇя尺ŔЯરƦᴿዪṚɌʁℛℜℝṘŘȐṜŖṞⱤ𝐑𝑅𝑹𝓡𝕽𝖱𝗥𝘙𝙍𝚁ᚱ🇷ᴚ"],
      ["r", "ⓡｒŕṙřȑȓṛṝŗгՐɾᥬṟɍʳ⒭ɼѓᴦᶉ𝐫𝑟𝒓𝓇𝓻𝔯𝕣𝖗𝗋𝗿𝘳𝙧ᵲґᵣ"],
      ["S", "🅂ꇙ𝓢𝗦Ꮪ𝒮Ꮥ𝚂𝐒ꓢ𝖲𝔖𝙎𐊖𝕾𐐠𝘚𝕊𝑆𝑺🆂🅢ⓈＳṨŞֆՏȘˢ⒮ЅṠŠŚṤŜṦṢടᔕᔖᔢᔡᔣᔤ"],
      ["s", "ⓢꜱ𐑈ꮪｓśṥŝṡšṧʂṣṩѕşșȿᶊక𝐬𝑠𝒔𝓈𝓼𝔰𝕤𝖘𝗌𝘀𝘴𝙨𝚜ގ🇸"],
      ["T", "🅃🆃𐌕𝚻𝛵𝕋𝕿𝑻𐊱𐊗𝖳𝙏🝨𝝩𝞣𝚃𝘛𝑇ꓔ⟙𝐓Ⲧ𝗧⊤𝔗Ꭲꭲ𝒯🅣⏇⏉ⓉＴтҬҭƬイŦԵτᴛᵀｲፕϮŤ⊥ƮΤТ下ṪṬȚŢṰṮ丅丁ᐪ𝛕𝜏𝝉𝞃𝞽𝓣ㄒ🇹ጥ"],
      ["t", "ⓣｔṫẗťṭțȶ੮էʇ†ţṱṯƭŧᵗ⒯ʈեƫ𝐭𝑡𝒕𝓉𝓽𝔱𝕥𝖙𝗍𝘁𝘵𝙩𝚝ナ"],
      ["U", "🅄ꓴ𐓎꒤🆄🅤ŨŬŮᑗᑘǓǕǗǙⓊＵȖᑌ凵ƱմԱꓵЦŪՄƲᙀᵁᵘ⒰ŰપÜՍÙÚÛṸṺǛỦȔƯỪỨỮỬỰỤṲŲṶṴɄᥩᑧ∪ᘮ⋃𝐔𝑈𝑼𝒰𝓤𝔘𝕌𝖀𝖴𝗨𝘜𝙐𝚄🇺"],
      ["u", "ὺύⓤｕùũūừṷṹŭǖữᥙǚǜὗυΰนսʊǘǔúůᴜűųยûṻцሁüᵾᵤµʋủȕȗưứửựụṳṵʉῠῡῢΰῦῧὐὑϋύὒὓὔὕὖᥔ𝐮𝑢𝒖𝓊𝓾𝔲𝕦𝖚𝗎ᶙ"],
      ["V", "🅅ꓦ𝑽𝖵𝘝Ꮩ𝚅𝙑𝐕🆅🅥ⓋＶᐯѴᵛ⒱۷ṾⅴⅤṼ٧ⴸѶᐺᐻ🇻𝓥"],
      ["v", "ሀⓥｖ𝜐𝝊ṽṿ౮งѵעᴠνטᵥѷ៴ᘁ𝙫𝚟𝛎𝜈𝝂𝝼𝞶𝘷𝘃𝓿"],
      ["W", "🅆ᏔᎳ𝑾ꓪ𝒲𝘞🆆Ⓦ🅦ｗＷẂᾧᗯᥕ山ѠຟచաЩШώщฬшᙎᵂʷ⒲ฝሠẄԜẀŴẆẈധᘺѿᙡƜ₩🇼"],
      ["w", "ẁꮃẃⓦ⍵ŵẇẅẘẉⱳὼὠὡὢὣωὤὥὦὧῲῳῴῶῷⱲѡԝᴡώᾠᾡᾢᾣᾤᾥᾦɯ𝝕𝟉𝞏"],
      ["X", "🞨🞩🞪🅇🞫🞬𐌗Ⲭꓫ𝖃𝞦𝘟𐊐𝚾𝝬𝜲Ꭓ𐌢𝖷𝑋𝕏𝔛𐊴𝗫🆇🅧❌Ⓧ𝓧ＸẊ᙭χㄨ𝒳ӾჯӼҳЖΧҲᵡˣ⒳אሸẌꊼⅩХ╳᙮ᕁᕽⅹᚷⵝ𝙓𝚇乂𝐗🇽"],
      ["x", "ⓧｘхẋ×ₓ⤫⤬⨯ẍᶍ𝙭ӽ𝘹𝐱𝚡⨰ﾒ𝔁"],
      ["Y", "Ⲩ𝚈𝑌𝗬𝐘ꓬ𝒀𝜰𐊲🆈🅨ⓎＹὛƳㄚʏ⅄ϔ￥¥ՎϓγץӲЧЎሃŸɎϤΥϒҮỲÝŶỸȲẎỶỴῨῩῪΎὙὝὟΫΎӮӰҰұ𝕐🇾"],
      ["y", "🅈ᎽᎩⓨｙỳýŷỹȳẏÿỷуყẙỵƴɏᵞɣʸᶌү⒴ӳӱӯўУʎ"],
      ["Z", "🅉ꓜ𝗭𝐙☡Ꮓ𝘡🆉🅩ⓏＺẔƵ乙ẐȤᶻ⒵ŹℤΖŻŽẒⱫ🇿"],
      ["z", "ꮓⓩｚźẑżžẓẕƶȥɀᴢጊʐⱬᶎʑᙆ"]
    ]);
  }
});

// node_modules/obscenity/dist/transformer/resolve-confusables/index.js
var require_resolve_confusables = __commonJS({
  "node_modules/obscenity/dist/transformer/resolve-confusables/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveConfusablesTransformer = void 0;
    var remap_characters_1 = require_remap_characters();
    var confusables_1 = require_confusables();
    function resolveConfusablesTransformer2() {
      return (0, remap_characters_1.remapCharactersTransformer)(confusables_1.confusables);
    }
    exports.resolveConfusablesTransformer = resolveConfusablesTransformer2;
  }
});

// node_modules/obscenity/dist/transformer/resolve-leetspeak/dictionary.js
var require_dictionary = __commonJS({
  "node_modules/obscenity/dist/transformer/resolve-leetspeak/dictionary.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dictionary = void 0;
    exports.dictionary = /* @__PURE__ */ new Map([
      ["a", "@4"],
      ["c", "("],
      ["e", "3"],
      ["i", "1|!"],
      ["g", "6"],
      ["o", "0"],
      ["s", "$5"],
      ["t", "7"],
      ["z", "2"]
    ]);
  }
});

// node_modules/obscenity/dist/transformer/resolve-leetspeak/index.js
var require_resolve_leetspeak = __commonJS({
  "node_modules/obscenity/dist/transformer/resolve-leetspeak/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveLeetSpeakTransformer = void 0;
    var remap_characters_1 = require_remap_characters();
    var dictionary_1 = require_dictionary();
    function resolveLeetSpeakTransformer2() {
      return (0, remap_characters_1.remapCharactersTransformer)(dictionary_1.dictionary);
    }
    exports.resolveLeetSpeakTransformer = resolveLeetSpeakTransformer2;
  }
});

// node_modules/obscenity/dist/transformer/to-ascii-lowercase/index.js
var require_to_ascii_lowercase = __commonJS({
  "node_modules/obscenity/dist/transformer/to-ascii-lowercase/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toAsciiLowerCaseTransformer = void 0;
    var Char_1 = require_Char();
    var Transformers_1 = require_Transformers();
    function toAsciiLowerCaseTransformer2() {
      return (0, Transformers_1.createSimpleTransformer)((c) => (0, Char_1.isUpperCase)(c) ? (0, Char_1.invertCaseOfAlphabeticChar)(c) : c);
    }
    exports.toAsciiLowerCaseTransformer = toAsciiLowerCaseTransformer2;
  }
});

// node_modules/obscenity/dist/preset/english.js
var require_english = __commonJS({
  "node_modules/obscenity/dist/preset/english.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.englishDataset = exports.englishRecommendedTransformers = exports.englishRecommendedWhitelistMatcherTransformers = exports.englishRecommendedBlacklistMatcherTransformers = void 0;
    var DataSet_1 = require_DataSet();
    var Pattern_1 = require_Pattern();
    var collapse_duplicates_1 = require_collapse_duplicates();
    var resolve_confusables_1 = require_resolve_confusables();
    var resolve_leetspeak_1 = require_resolve_leetspeak();
    var to_ascii_lowercase_1 = require_to_ascii_lowercase();
    exports.englishRecommendedBlacklistMatcherTransformers = [
      (0, resolve_confusables_1.resolveConfusablesTransformer)(),
      (0, resolve_leetspeak_1.resolveLeetSpeakTransformer)(),
      (0, to_ascii_lowercase_1.toAsciiLowerCaseTransformer)(),
      // See #23 and #46.
      // skipNonAlphabeticTransformer(),
      (0, collapse_duplicates_1.collapseDuplicatesTransformer)({
        defaultThreshold: 1,
        customThresholds: /* @__PURE__ */ new Map([
          ["b", 2],
          ["e", 2],
          ["o", 2],
          ["l", 2],
          ["s", 2],
          ["g", 2]
          // ni_gg_er
        ])
      })
    ];
    exports.englishRecommendedWhitelistMatcherTransformers = [
      (0, to_ascii_lowercase_1.toAsciiLowerCaseTransformer)(),
      (0, collapse_duplicates_1.collapseDuplicatesTransformer)({
        defaultThreshold: Number.POSITIVE_INFINITY,
        customThresholds: /* @__PURE__ */ new Map([[" ", 1]])
        // collapse spaces
      })
    ];
    exports.englishRecommendedTransformers = {
      blacklistMatcherTransformers: exports.englishRecommendedBlacklistMatcherTransformers,
      whitelistMatcherTransformers: exports.englishRecommendedWhitelistMatcherTransformers
    };
    exports.englishDataset = new DataSet_1.DataSet().addPhrase((phrase) => phrase.setMetadata({ originalWord: "abo" }).addPattern((0, Pattern_1.pattern)`|ab[b]o[s]|`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "abeed" }).addPattern((0, Pattern_1.pattern)`ab[b]eed`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "africoon" }).addPattern((0, Pattern_1.pattern)`africoon`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "anal" }).addPattern((0, Pattern_1.pattern)`|anal`).addWhitelistedTerm("analabos").addWhitelistedTerm("analagous").addWhitelistedTerm("analav").addWhitelistedTerm("analy").addWhitelistedTerm("analog").addWhitelistedTerm("an al").addPattern((0, Pattern_1.pattern)`danal`).addPattern((0, Pattern_1.pattern)`eanal`).addPattern((0, Pattern_1.pattern)`fanal`).addWhitelistedTerm("fan al").addPattern((0, Pattern_1.pattern)`ganal`).addWhitelistedTerm("gan al").addPattern((0, Pattern_1.pattern)`ianal`).addWhitelistedTerm("ian al").addPattern((0, Pattern_1.pattern)`janal`).addWhitelistedTerm("trojan al").addPattern((0, Pattern_1.pattern)`kanal`).addPattern((0, Pattern_1.pattern)`lanal`).addWhitelistedTerm("lan al").addPattern((0, Pattern_1.pattern)`lanal`).addWhitelistedTerm("lan al").addPattern((0, Pattern_1.pattern)`oanal|`).addPattern((0, Pattern_1.pattern)`panal`).addWhitelistedTerm("pan al").addPattern((0, Pattern_1.pattern)`qanal`).addPattern((0, Pattern_1.pattern)`ranal`).addPattern((0, Pattern_1.pattern)`sanal`).addPattern((0, Pattern_1.pattern)`tanal`).addWhitelistedTerm("tan al").addPattern((0, Pattern_1.pattern)`uanal`).addWhitelistedTerm("uan al").addPattern((0, Pattern_1.pattern)`vanal`).addWhitelistedTerm("van al").addPattern((0, Pattern_1.pattern)`wanal`).addPattern((0, Pattern_1.pattern)`xanal`).addWhitelistedTerm("texan al").addPattern((0, Pattern_1.pattern)`yanal`).addPattern((0, Pattern_1.pattern)`zanal`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "anus" }).addPattern((0, Pattern_1.pattern)`anus`).addWhitelistedTerm("an us").addWhitelistedTerm("tetanus").addWhitelistedTerm("uranus").addWhitelistedTerm("janus").addWhitelistedTerm("manus")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "arabush" }).addPattern((0, Pattern_1.pattern)`arab[b]ush`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "arse" }).addPattern((0, Pattern_1.pattern)`|ars[s]e`).addWhitelistedTerm("arsen")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "ass" }).addPattern((0, Pattern_1.pattern)`|ass`).addWhitelistedTerm("assa").addWhitelistedTerm("assem").addWhitelistedTerm("assen").addWhitelistedTerm("asser").addWhitelistedTerm("asset").addWhitelistedTerm("assev").addWhitelistedTerm("assi").addWhitelistedTerm("assoc").addWhitelistedTerm("assoi").addWhitelistedTerm("assu")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "bastard" }).addPattern((0, Pattern_1.pattern)`bas[s]tard`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "bestiality" }).addPattern((0, Pattern_1.pattern)`be[e][a]s[s]tial`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "bitch" }).addPattern((0, Pattern_1.pattern)`bitch`).addPattern((0, Pattern_1.pattern)`bich|`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "blowjob" }).addPattern((0, Pattern_1.pattern)`b[b]l[l][o]wj[o]b`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "bollocks" }).addPattern((0, Pattern_1.pattern)`bol[l]ock`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "boob" }).addPattern((0, Pattern_1.pattern)`boob`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "boonga" }).addPattern((0, Pattern_1.pattern)`boonga`).addWhitelistedTerm("baboon ga")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "buttplug" }).addPattern((0, Pattern_1.pattern)`buttplug`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "chingchong" }).addPattern((0, Pattern_1.pattern)`chingchong`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "chink" }).addPattern((0, Pattern_1.pattern)`chink`).addWhitelistedTerm("chin k")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "cock" }).addPattern((0, Pattern_1.pattern)`|cock|`).addPattern((0, Pattern_1.pattern)`|cocks`).addPattern((0, Pattern_1.pattern)`|cockp`).addPattern((0, Pattern_1.pattern)`|cocke[e]|`).addWhitelistedTerm("cockney")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "cuck" }).addPattern((0, Pattern_1.pattern)`cuck`).addWhitelistedTerm("cuckoo")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "cum" }).addPattern((0, Pattern_1.pattern)`|cum`).addWhitelistedTerm("cumu").addWhitelistedTerm("cumb")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "cunt" }).addPattern((0, Pattern_1.pattern)`|cunt`).addPattern((0, Pattern_1.pattern)`cunt|`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "deepthroat" }).addPattern((0, Pattern_1.pattern)`deepthro[o]at`).addPattern((0, Pattern_1.pattern)`deepthro[o]t`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "dick" }).addPattern((0, Pattern_1.pattern)`|dck|`).addPattern((0, Pattern_1.pattern)`dick`).addWhitelistedTerm("benedick").addWhitelistedTerm("dickens")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "dildo" }).addPattern((0, Pattern_1.pattern)`dildo`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "doggystyle" }).addPattern((0, Pattern_1.pattern)`d[o]g[g]ys[s]t[y]l[l]`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "double penetration" }).addPattern((0, Pattern_1.pattern)`double penetra`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "dyke" }).addPattern((0, Pattern_1.pattern)`dyke`).addWhitelistedTerm("van dyke")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "ejaculate" }).addPattern((0, Pattern_1.pattern)`e[e]jacul`).addPattern((0, Pattern_1.pattern)`e[e]jakul`).addPattern((0, Pattern_1.pattern)`e[e]acul[l]ate`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "fag" }).addPattern((0, Pattern_1.pattern)`|fag`).addPattern((0, Pattern_1.pattern)`fggot`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "felch" }).addPattern((0, Pattern_1.pattern)`fe[e]l[l]ch`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "fellatio" }).addPattern((0, Pattern_1.pattern)`f[e][e]llat`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "finger bang" }).addPattern((0, Pattern_1.pattern)`fingerbang`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "fisting" }).addPattern((0, Pattern_1.pattern)`fistin`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "fuck" }).addPattern((0, Pattern_1.pattern)`f[?]ck`).addPattern((0, Pattern_1.pattern)`|fk`).addPattern((0, Pattern_1.pattern)`|fu|`).addPattern((0, Pattern_1.pattern)`|fuk`).addWhitelistedTerm("fick").addWhitelistedTerm("kung-fu").addWhitelistedTerm("kung fu")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "gangbang" }).addPattern((0, Pattern_1.pattern)`g[?]ngbang`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "handjob" }).addPattern((0, Pattern_1.pattern)`h[?]ndjob`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "hentai" }).addPattern((0, Pattern_1.pattern)`h[e][e]ntai`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "hooker" }).addPattern((0, Pattern_1.pattern)`hooker`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "incest" }).addPattern((0, Pattern_1.pattern)`incest`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "jerk off" }).addPattern((0, Pattern_1.pattern)`jerkoff`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "jizz" }).addPattern((0, Pattern_1.pattern)`jizz`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "kike" }).addPattern((0, Pattern_1.pattern)`kike`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "lubejob" }).addPattern((0, Pattern_1.pattern)`lubejob`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "masturbate" }).addPattern((0, Pattern_1.pattern)`m[?]sturbate`).addPattern((0, Pattern_1.pattern)`masterbate`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "negro" }).addPattern((0, Pattern_1.pattern)`negro`).addWhitelistedTerm("montenegro").addWhitelistedTerm("negron").addWhitelistedTerm("stoneground").addWhitelistedTerm("winegrow")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "nigger" }).addPattern((0, Pattern_1.pattern)`n[i]gger`).addPattern((0, Pattern_1.pattern)`n[i]gga`).addPattern((0, Pattern_1.pattern)`|nig|`).addPattern((0, Pattern_1.pattern)`|nigs|`).addWhitelistedTerm("snigger")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "orgasm" }).addPattern((0, Pattern_1.pattern)`[or]gasm`).addWhitelistedTerm("gasma")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "orgy" }).addPattern((0, Pattern_1.pattern)`orgy`).addPattern((0, Pattern_1.pattern)`orgies`).addWhitelistedTerm("porgy")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "penis" }).addPattern((0, Pattern_1.pattern)`pe[e]nis`).addPattern((0, Pattern_1.pattern)`|pnis`).addWhitelistedTerm("pen is")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "piss" }).addPattern((0, Pattern_1.pattern)`|piss`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "porn" }).addPattern((0, Pattern_1.pattern)`|prn|`).addPattern((0, Pattern_1.pattern)`porn`).addWhitelistedTerm("p orna")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "prick" }).addPattern((0, Pattern_1.pattern)`|prick[s]|`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "pussy" }).addPattern((0, Pattern_1.pattern)`p[u]ssy`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "rape" }).addPattern((0, Pattern_1.pattern)`|rape`).addPattern((0, Pattern_1.pattern)`|rapis[s]t`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "retard" }).addPattern((0, Pattern_1.pattern)`retard`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "scat" }).addPattern((0, Pattern_1.pattern)`|s[s]cat|`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "semen" }).addPattern((0, Pattern_1.pattern)`|s[s]e[e]me[e]n`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "sex" }).addPattern((0, Pattern_1.pattern)`|s[s]e[e]x|`).addPattern((0, Pattern_1.pattern)`|s[s]e[e]xy|`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "shit" }).addPattern((0, Pattern_1.pattern)`|shit`).addPattern((0, Pattern_1.pattern)`shit|`).addWhitelistedTerm("s hit").addWhitelistedTerm("sh it").addWhitelistedTerm("shi t").addWhitelistedTerm("shitake")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "slut" }).addPattern((0, Pattern_1.pattern)`s[s]lut`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "spastic" }).addPattern((0, Pattern_1.pattern)`|spastic`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "tit" }).addPattern((0, Pattern_1.pattern)`|tit|`).addPattern((0, Pattern_1.pattern)`|tits|`).addPattern((0, Pattern_1.pattern)`|titt`).addPattern((0, Pattern_1.pattern)`|tiddies`).addPattern((0, Pattern_1.pattern)`|tities`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "tranny" }).addPattern((0, Pattern_1.pattern)`tranny`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "turd" }).addPattern((0, Pattern_1.pattern)`|turd`).addWhitelistedTerm("turducken")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "twat" }).addPattern((0, Pattern_1.pattern)`|twat`).addWhitelistedTerm("twattle")).addPhrase((phrase) => phrase.setMetadata({ originalWord: "vagina" }).addPattern((0, Pattern_1.pattern)`vagina`).addPattern((0, Pattern_1.pattern)`|v[?]gina`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "wank" }).addPattern((0, Pattern_1.pattern)`|wank`)).addPhrase((phrase) => phrase.setMetadata({ originalWord: "whore" }).addPattern((0, Pattern_1.pattern)`|wh[o]re|`).addPattern((0, Pattern_1.pattern)`|who[o]res[s]|`).addWhitelistedTerm("who're"));
  }
});

// node_modules/obscenity/dist/transformer/skip-non-alphabetic/index.js
var require_skip_non_alphabetic = __commonJS({
  "node_modules/obscenity/dist/transformer/skip-non-alphabetic/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.skipNonAlphabeticTransformer = void 0;
    var Char_1 = require_Char();
    var Transformers_1 = require_Transformers();
    function skipNonAlphabeticTransformer2() {
      return (0, Transformers_1.createSimpleTransformer)((c) => (0, Char_1.isAlphabetic)(c) ? c : void 0);
    }
    exports.skipNonAlphabeticTransformer = skipNonAlphabeticTransformer2;
  }
});

// node_modules/obscenity/dist/index.js
var require_dist = __commonJS({
  "node_modules/obscenity/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_BuiltinStrategies(), exports);
    __exportStar(require_TextCensor(), exports);
    __exportStar(require_DataSet(), exports);
    __exportStar(require_RegExpMatcher(), exports);
    __exportStar(require_BlacklistedTerm(), exports);
    __exportStar(require_MatchPayload(), exports);
    __exportStar(require_Matcher(), exports);
    __exportStar(require_Nodes(), exports);
    __exportStar(require_ParserError(), exports);
    __exportStar(require_Pattern(), exports);
    __exportStar(require_english(), exports);
    __exportStar(require_collapse_duplicates(), exports);
    __exportStar(require_remap_characters(), exports);
    __exportStar(require_resolve_confusables(), exports);
    __exportStar(require_resolve_leetspeak(), exports);
    __exportStar(require_skip_non_alphabetic(), exports);
    __exportStar(require_to_ascii_lowercase(), exports);
  }
});

// node_modules/obscenity/dist/index.mjs
var import_index = __toESM(require_dist(), 1);
var dist_default = import_index.default;
var DataSet = import_index.default.DataSet;
var ParserError = import_index.default.ParserError;
var PhraseBuilder = import_index.default.PhraseBuilder;
var RegExpMatcher = import_index.default.RegExpMatcher;
var SyntaxKind = import_index.default.SyntaxKind;
var TextCensor = import_index.default.TextCensor;
var assignIncrementingIds = import_index.default.assignIncrementingIds;
var asteriskCensorStrategy = import_index.default.asteriskCensorStrategy;
var collapseDuplicatesTransformer = import_index.default.collapseDuplicatesTransformer;
var compareMatchByPositionAndId = import_index.default.compareMatchByPositionAndId;
var englishDataset = import_index.default.englishDataset;
var englishRecommendedBlacklistMatcherTransformers = import_index.default.englishRecommendedBlacklistMatcherTransformers;
var englishRecommendedTransformers = import_index.default.englishRecommendedTransformers;
var englishRecommendedWhitelistMatcherTransformers = import_index.default.englishRecommendedWhitelistMatcherTransformers;
var fixedCharCensorStrategy = import_index.default.fixedCharCensorStrategy;
var fixedPhraseCensorStrategy = import_index.default.fixedPhraseCensorStrategy;
var grawlixCensorStrategy = import_index.default.grawlixCensorStrategy;
var keepEndCensorStrategy = import_index.default.keepEndCensorStrategy;
var keepStartCensorStrategy = import_index.default.keepStartCensorStrategy;
var parseRawPattern = import_index.default.parseRawPattern;
var pattern = import_index.default.pattern;
var randomCharFromSetCensorStrategy = import_index.default.randomCharFromSetCensorStrategy;
var remapCharactersTransformer = import_index.default.remapCharactersTransformer;
var resolveConfusablesTransformer = import_index.default.resolveConfusablesTransformer;
var resolveLeetSpeakTransformer = import_index.default.resolveLeetSpeakTransformer;
var skipNonAlphabeticTransformer = import_index.default.skipNonAlphabeticTransformer;
var toAsciiLowerCaseTransformer = import_index.default.toAsciiLowerCaseTransformer;
export {
  DataSet,
  ParserError,
  PhraseBuilder,
  RegExpMatcher,
  SyntaxKind,
  TextCensor,
  assignIncrementingIds,
  asteriskCensorStrategy,
  collapseDuplicatesTransformer,
  compareMatchByPositionAndId,
  dist_default as default,
  englishDataset,
  englishRecommendedBlacklistMatcherTransformers,
  englishRecommendedTransformers,
  englishRecommendedWhitelistMatcherTransformers,
  fixedCharCensorStrategy,
  fixedPhraseCensorStrategy,
  grawlixCensorStrategy,
  keepEndCensorStrategy,
  keepStartCensorStrategy,
  parseRawPattern,
  pattern,
  randomCharFromSetCensorStrategy,
  remapCharactersTransformer,
  resolveConfusablesTransformer,
  resolveLeetSpeakTransformer,
  skipNonAlphabeticTransformer,
  toAsciiLowerCaseTransformer
};
//# sourceMappingURL=obscenity.js.map
