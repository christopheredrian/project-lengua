const express = require('express');
const router = express.Router();
const sentiment = require('sentiment');
const mongoose = require('mongoose');
const afinn165 = require('../lib/AFINN.json');

// Load word model
require('../models/Word');
const Word = mongoose.model('words');

// TODO: Refactor to helpers
/**
 * Returns true if the word is in the afin165 list
 * @param {string} word 
 */
const isInAfinn = function (word) {
	const obj = afinn165;
	return !!obj[word];
}

/**
 * Remove special characters and return an array of tokens (words).
 * @param  {string} input Input string
 * @return {array}        Array of tokens
 */
const tokenize = function (input) {
	return input
		.toLowerCase()
		.replace(/\n/g, ' ')
		.replace(/[.,\/#!$%\^&\*;:{}=_`\"~()]/g, '')
		.split(' ');
};

/**
 * Returns true if the word is in the local dictionary
 * @param {string} word 
 * @param {function} callback 
 */
const isInLocalWords = function (word, callback) {
	// TODO: Add Promise support
	const count = Word.find({ 'word': word })
		.count()
		.then((res) => {
			callback(!!res);
		});
}

/**
 * Calls the callback with the result to be true if it's in the local
 * and afinn dictionary
 * @param {String} sentence 
 */
const addToDictionary = (sentence) => {
	// TODO: Add Promise support
	const words = tokenize(sentence);
	const obj = afinn165;

	words.forEach((word) => {
		isInLocalWords(word, (isInLocal) => {
			if (!isInAfinn(word) && !isInLocal) {
				const newWord = {
					word: word,
					dialect: 'unlisted',
					user: 'unlisted'
				}
				new Word(newWord)
					.save()
					.then((word) => {
						console.log('Unlisted word ' + word + ' added');
					});
			}
		});
	})
};

router.get('/', (req, res) => {
	res.render('api/index');
});

router.get('/dialects', (req, res) => {
	Word.find()
		.distinct('dialect')
		.then((dialects) => {
			return res.json(dialects);
		});
});

router.get('/sentiment/sentence', (req, res) => {
	// Add the word list
	addToDictionary(req.query.sentence)

	Word.find({}, {
		'word': 1,
		'score': 1,
		_id: 0
	})
		.then(words => {
			localDictionary = {};
			// TODO: use query instead
			words.forEach((word) => {
				localDictionary[word.word] = word.score;
			});
			res.json(sentiment(req.query.sentence, localDictionary));
		});
	// var result = sentiment(req.query.sentence);
	// res.json(result);
});


router.post('/sentiment/sentence', (req, res) => {
	res.send('TBI');
});

router.post('/sentiment/sentences', (req, res) => {
	try {
		console.log(req.body.sentences);
		// Add the word list
		if (!isJsonString(req.body.sentences)) {
			res.json({
				error: 'json invalid'
			});
		}
		let obj = JSON.parse(req.body.sentences);
		let response = [];
		Word.find({}, {
			'word': 1,
			'score': 1,
			_id: 0
		})
			.then(words => {
				localDictionary = {};
				// TODO: use query instead
				words.forEach((word) => {
					localDictionary[word.word] = word.score;
				});
				obj.sentences.forEach((sentence) => {
					// Add unlisted words
					addToDictionary(sentence)
					let res = sentiment(sentence, localDictionary);
					response.push({
						'sentiment-result': res,
						'sentence': sentence,
						sentiment: getSentimentString(res.score)
					});
				});
				// res.end();
				res.json(response);
			});

	} catch (error) {
		res.json(error)
	}
});

function isJsonString(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

/** Words */
router.get('/words', (req, res) => {
	console.log(!!req.query.word);
	var search = {};
	// letter = 'a';
	letter = '';
	if (!!req.query.letter) {
		letter = req.query.letter.toLowerCase();
	}
	console.log(letter);
	console.log(req.query.word);
	if (!!req.query.word) {

		search = {
			$and: [{
				word: {
					$regex: '.*' + req.query.word + '.*'
				}
			},
			{
				dialect: req.query.dialect
			}
			]
		}
	} else {
		if (!!req.query.dialect) {
			// if (!!req.query.word) {
			if (!!req.query.word) {
				search = {
					$and: [{
						'dialect': req.query.dialect

					},
					{
						'word': {
							$regex: '.*' + req.query.word + '.*'
						}
					}
					]
				}
			} else if (!!req.query.letter) {
				search = {
					$and: [{
						'dialect': req.query.dialect

					},
					{
						'word': {
							$regex: '^' + letter + '.*'
						}
					}
					]
				}
			} else {
				search = {
					'dialect': req.query.dialect
				}
			}
		} else {
			search = {
				'word': {
					$regex: '^' + letter + '.*'
				}
			};

		}
	}

	console.log(search);
	Word.find(search)
		.sort({
			date: 'desc'
		})
		.then(words => {
			res.json(words);

		});
});

function getSentimentString(score) {
	if (score === 0) {
		return 'neutral'
	} else if (score > 0) {
		return 'positive'
	} else if (score < 0) {
		return 'negative'
	}
}
module.exports = router;