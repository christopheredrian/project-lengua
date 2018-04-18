const express = require('express');
const router = express.Router();
const sentiment = require('sentiment');
const mongoose = require('mongoose');
const afinn165 = require('../lib/AFINN.json');

// Load word model
require('../models/Word');
const Word = mongoose.model('words');

const {
	ensureAuthenticated
} = require('../helpers/auth');

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
	res.render('api/index', );
});


/**
 * Gets the total word count including the unlisted words
 */
router.get('/totalWordCount', (req, res) => {
	Word.count({}, function (err, count) {
		if (err) throw err;
		return res.json({ totalWordCount: count })
	});
});

/**
 * Gets the total unlisted words count
 */
router.get('/totalUnlistedCount', (req, res) => {
	Word.count({ dialect: 'unlisted' }, function (err, count) {
		if (err) throw err;
		console.log("TUC:" + count);
		return res.json({ totalUnlistedCount: count })
	});
});

/**
 * Returns the dialects and their respective counts
 */
router.get('/dialects', (req, res) => {
	const aggregatorOpts = [
		{
			$group: {
				_id: { dialect: "$dialect" },
				count: { $sum: 1 }
			}
		}
	]
	Word.aggregate(aggregatorOpts).then((dialects) => {
		console.log(dialects)
		return res.json(dialects);
	});
});

/**
 * Get the sentiment of a sentence
 * @return JSON object
 */
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
				localDictionary[word.word] = word.score || 0;
			});
			res.json(sentiment(req.query.sentence, localDictionary));
		});
	// var result = sentiment(req.query.sentence);
	// res.json(result);
});

/**
 * Returns the sentiment of a sentence
 */
router.post('/sentiment/sentence', (req, res) => {
	// TODO: similar to the get request above
	res.send('TBI');
});

/**
 * Returns the sentiment of sentences
 */
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
					localDictionary[word.word] = word.score || 0;
				});
				obj.sentences.forEach((sentence) => {
					// Add unlisted words
					addToDictionary(sentence);
					console.log(localDictionary);
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

/**
 * Utility for determining if a string is JSON
 * @param {} str 
 */
function isJsonString(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

/**
 * Get all words, returns a JSON object of words
 */
router.get('/words', (req, res) => {
	console.log(!!req.query.word);
	var search = {};
	letter = '';
	if (!!req.query.letter) {
		letter = req.query.letter.toLowerCase();
	}
	console.log(letter);
	console.log(req.query.word);
	// We have a word
	if (!!req.query.word) {

		search = {
			$and: [{
				word: {
					$regex: '.*' + req.query.word + '.*'
				}
			},
			{
				dialect: req.query.dialect || new RegExp(".*")
			}
			]
		}
	} else {
		// We have a dialect
		if (!!req.query.dialect) {
			// but we have a word
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

/**
 * Add a word
 */
router.post('/words/add', ensureAuthenticated, (req, res) => {
	// validations
	let errors = [];
	if (wordValid(req, res)) {
		// No errors - add the new rod
		const newWord = {
			word: req.body.word.toLowerCase(),
			dialect: req.body.dialect,
			score: req.body.score,
			user: req.user.id
		}
		new Word(newWord)
			.save()
			.then((word) => {
				req.flash('success_msg', 'Word Added');
				res.redirect('/words')
			});
	}

});

/**
 * Update API 
 */
router.post('/words/update', ensureAuthenticated, (req, res) => {
	if (wordValid(req, res)) {
		Word.findOne({
			_id: req.body.id
		})
			.then(word => {
				word.word = req.body.word.toLowerCase();
				word.score = req.body.score;
				word.dialect = req.body.dialect;
				word.save()
					.then(word => {
						res.json({ message: 'success' });
					});
			});
	}
});

/**
 * Word delete
 */
router.post('/words/delete/:id', ensureAuthenticated, (req, res) => {
	Word.remove({
		_id: req.params.id
	})
		.then(() => {
			res.json({ 'message': 'Successfully deleted message' });
		});
});

/**
 * Helper method for word validation
 */
function wordValid(req, res) {
	let errors = [];
	if (!req.body.word) {
		errors.push({
			text: 'Please add a word'
		});
	}
	if (!req.body.dialect) {
		errors.push({
			text: 'Please add a dialect'
		});
	}
	if (!req.body.score) {
		errors.push({
			text: 'Please add a score'
		});
	}
	// We have errors
	if (errors.length > 0) {
		res.json({
			errors: errors,
			word: req.body.word,
			dialect: req.body.dialect,
			score: req.body.score
		});
	} else {
		return true;
	}
}
/**
 * Helper method for getting the sentiment of a score
 * @param {} score 
 */
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