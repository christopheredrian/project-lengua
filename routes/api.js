const express = require('express');
const router = express.Router();
const sentiment = require('sentiment');
const mongoose = require('mongoose');

// Load word model
require('../models/Word');
const Word = mongoose.model('words');

router.get('/', (req, res) => {
	res.render('api/index');
});

router.get('/sentiment/sentence', (req, res) => {
	// Add the word list
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
		obj.sentences.forEach((sentence) => {
			let res = sentiment(sentence);
			response.push({
				'sentiment-result': res,
				'sentence': sentence,
				sentiment: getSentimentString(res.score)
			});
		});
		// res.end();
		res.json(response);
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
	if (!!req.query.word) {
		search = {
			$or: [{
					word: {
						$regex: '.*' + req.query.word + '.*'
					}
				},
				{
					dialect: {
						$regex: '.*' + req.query.word + '.*'
					}
				}
			]
		}
	} else {
		search = {};
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

function getSentimentString(score){
	if(score === 0){
		return 'neutral'
	} else if(score > 0){
		return 'positive'
	} else if (score < 0){
		return 'negative'
	}
}
module.exports = router;