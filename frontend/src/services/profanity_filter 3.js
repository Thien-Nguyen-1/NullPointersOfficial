


import {RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers} from 'obscenity'


const matcher = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});

const censor = new TextCensor();


/* Define custom censoring here*/
const keepFirstLetterStrategy = (ctx) => ctx.input[ctx.startIndex] + '*'.repeat(ctx.matchLength - 1);




censor.setStrategy(keepFirstLetterStrategy)


export const ProfanityFilter = {

    hasBadWord: (text) => {return matcher.hasMatch(text)},
    filterText: (text) => {
        const matches = matcher.getAllMatches(text)
        return censor.applyTo(text, matches)
    }
    

}