if (process.env.NODE_ENV === 'production') {
    module.exports = {
        mongoURI: 'mongodb://chris:chris@ds151508.mlab.com:51508/project-lengua-prod'
    };
} else {
    module.exports = {
        mongoURI: 'mongodb://localhost/project-lengua-dev'
    };
}