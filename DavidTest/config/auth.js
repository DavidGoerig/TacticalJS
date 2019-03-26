/*
** author: David Goerig
** project: dashboard
** fileuse: authentification
*/

/*
** expose our config directly to our application using module.exports
*/
module.exports = {

    'facebookAuth' : {
        'clientID'        : '1052871668209715',
        'clientSecret'    : 'd2552b0b50935f8b98f41eff01d7042e',
        'callbackURL'     : 'http://localhost:8080/auth/facebook/callback',
        'profileURL': 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
        'profileFields'   : ['id', 'email', 'name']

    }

};
