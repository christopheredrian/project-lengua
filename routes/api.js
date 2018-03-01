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
	Word.find({}, { 'word': 1, 'score': 1, _id: 0 })
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


module.exports = router;
