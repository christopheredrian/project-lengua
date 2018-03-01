const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const WordSchema = new Schema({
    word: {
        type: String,
        required: true
    },
    dialect: {
        type: String,        
    },
    score: {
        type: Number
    },
    user:{
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

mongoose.model('words', WordSchema);
