module.exports = {
    ensureAuthenticated: function(req,res,next){
        if(req.isAuthenticated()){
            next();
        } else{
            req.flash('error_msg', 'Not authorized');
            res.redirect('/users/login');
        }
    },
    isAdmin: function(req, res, next){
        if(req.isAuthenticated() && req.user.role === 'admin'){
            next();
        } else{
            req.flash('error_msg', 'Not authorized to manage users');
            res.redirect('/users/login');
        }  
    }
}