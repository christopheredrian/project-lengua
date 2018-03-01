const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const helpers = require('handlebars-helpers')();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override')

const flash = require('connect-flash');
const session = require('express-session');

const passport = require('passport');
const words = require('./routes/words');

// Passport config
require('./config/passport')(passport);

// db config
const db = require('./config/database');
const app = express();
const port = process.env.PORT || 5000;



// Map global promise - get rid of warning in console
mongoose.Promise = global.Promise;
// connect to mongoose
mongoose.connect(db.mongoURI, {
})
	.then(() => {
		console.log('Mongodb connected');
	})
	.catch((err) => {
		console.log(err)
	});



// MW - HANDLEBARS
var hbs = exphbs.create({
	defaultLayout: 'main',
	helpers: {
		json: function (object) {
			return JSON.stringify(object);
		},
		first: function (object) {
			return object[0];
		}
	}
});


// MW - body-parser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Method override middleware
app.use(methodOverride('X-HTTP-Method-Override'))

// Session
// app.set('trust proxy', 1) // trust first proxy
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true,
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');


// MIDDLEWARES - GLOBAL VARS
app.use(function (req, res, next) {
	// Flash messages
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.user = req.user || null;
	next();
});

app.get('/', (req, res) => {
	res.render('index', {
		title: 'Welcome!'
	});
});

app.get('/about', (req, res) => {
	res.render('about');
});

app.use('/words', words);
app.use('/users', require('./routes/users'));
app.use('/api', require('./routes/api'));






app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});