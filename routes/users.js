const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');

// Load model
require('../models/User');
const User = mongoose.model('users');

router.get('/login', (req, res) => {
    res.render('users/login');
});

router.post('/login', (req, res, next) => {
    // passport-local
    passport.authenticate('local', {
        successRedirect: '/words',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);

    // res.render('users/login');
});

router.get('/register', (req, res) => {
    res.render('users/register');
});

router.post('/register', (req, res) => {

    let errors = [];
    if (req.body.password !== req.body.confirm) {
        errors.push({ text: 'Password do not match' });
    }
    if (req.body.password.length < 4) {
        errors.push({ text: 'Password must alteast be 4 characters' });
    }
    if (errors.length > 0) {
        res.render('users/register', {
            errors,
            name: req.body.name,
            email: req.body.email
        });
    } else {
        User.findOne({ email: req.body.email })
            .then(user => {
                if (user) {
                    req.flash('error_msg', 'Email already registered');
                    res.redirect('/users/register');
                } else {
                    const newUser = new User({
                        name: req.body.name,
                        email: req.body.email,
                        password: req.body.password
                    });
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            newUser.password = hash;
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'User registered');
                                    res.redirect('/users/login');
                                });
                        });
                    });
                }
            });
    }
});

router.get('/logout',(req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out')
    res.redirect('/users/login');
});

module.exports = router;
