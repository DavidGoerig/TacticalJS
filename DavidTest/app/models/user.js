/*
** author: David Goerig
** project: dashboard
** fileuse: setup
*/

/*
**          **** get all the tools we need *****
*/
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
/*
**          **** DEFINE OUR MODEUL USER SCHEMA *****
*/
// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        password     : String
    },
    facebook         : {
        id           : String,
        token        : String,
        name         : String,
        email        : String
    },
    steamdb      : {
        id           : String,
        name         : String,
    },
    dashboard       : {
        widget1     : Boolean,
        widget2     : Boolean
    }
    /*
    ** COUCOU WILLI POUR RAJOUTER DES DELIRES AU USER C ICI!!
    */

});

/*
**          **** CREATING A HASH *****
*/
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

/*
**          **** CHECK IF PASSPOWRD IS THE GUD ONE *****
*/
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

/*
**          **** CREATE USER MODEL AND GIVE IT TO THE APPPP *****
*/
module.exports = mongoose.model('User', userSchema);
