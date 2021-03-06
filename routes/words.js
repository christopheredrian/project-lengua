const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');

const {
    ensureAuthenticated
} = require('../helpers/auth');
// Load word model
require('../models/Word');
const Word = mongoose.model('words');

/**
 * Add words view
 */
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('words/add');
});

/**
 * Edit words view
 */
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    Word.findOne({
        _id: req.params.id
    })
        .then((word) => {
            Word.find()
                .distinct('dialect')
            res.render('words/edit', {
                word
            });
        });
});

/**
 * Update word
 */
router.post('/update/:id', ensureAuthenticated, (req, res) => {
    Word.findOne({
        _id: req.params.id
    })
        .then(word => {
            word.word = req.body.word.toLowerCase();
            word.score = req.body.score;
            word.dialect = req.body.dialect;
            word.save()
                .then(word => {
                    req.flash('success_msg', 'Word Updated');
                    res.redirect('/words');
                });
        });
});

/**
 * Word delete
 */
router.post('/delete/:id', ensureAuthenticated, (req, res) => {
    Word.remove({
        _id: req.params.id
    })
        .then(() => {
            req.flash('success_msg', 'Word Removed');
            res.redirect('/words');
        });
});

/**
 * Display words
 */
router.get('/', ensureAuthenticated, (req, res) => {
    Word.find({})
        .sort({
            date: 'desc'
        })
        .then(words => {
            res.render('words/index', {
                words
            });
        });
});

/**
 * Add word post request
 */
router.post('/', ensureAuthenticated, (req, res) => {
    // validation
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
    if (errors.length > 0) {
        res.render('words/add', {
            errors: errors,
            word: req.body.word,
            dialect: req.body.dialect,
            score: req.body.score
        });
    } else {
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
        // res.send(req.body);
    }
});

/**
 * Route for getting the afinn text file
 */
router.get('/afinn-165', (req, res) => {
    var path = require('path')
    const afinn = fs.readFileSync(path.join(__dirname, '../lib/AFINN-en-165.txt'));
    res.send(afinn);
});

/**
 * Route for getting the dicitonary (for public)
 */
/**
 * Display words
 */
router.get('/dictionary', (req, res) => {
    Word.find({})
        .sort({
            date: 'desc'
        })
        .then(words => {
            res.render('words/dictionary', {
                words
            });
        });
});

module.exports = router;