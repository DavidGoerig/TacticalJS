/*
** author: David Goerig
** project: dashboard
** fileuse: setup
*/

// load all the constants
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var SteamStrategy = require("passport-steam");

// load up the user model
var User       = require('../app/models/user');

// load the auth variables
var configAuth = require('./auth');

module.exports = function(passport) {
    /*
    ** passport session setup
    */
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    /*
    **  local login
    */
    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase();

        // asynchronous
        process.nextTick(function() {
            User.findOne({ 'local.email' :  email }, function(err, user) {
                if (err)
                    return done(err);
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.'));

                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                else
                    return done(null, user);
            });
        });

    }));
    /*
    **  Local signup
    */
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase();
        process.nextTick(function() {
            if (!req.user) {
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {
                        // create the user
                        var newUser            = new User();
                        newUser.local.email    = email;
                        newUser.local.password = newUser.generateHash(password);

                        newUser.save(function(err) {
                            if (err)
                                return done(err);

                            return done(null, newUser);
                        });
                    }

                });
            // if the user is logged in but has not localy
            } else if ( !req.user.local.email ) {
                // check if the email used to connect a local account is being used by another user
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
                        // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                    } else {
                        var user = req.user;
                        user.local.email = email;
                        user.local.password = user.generateHash(password);
                        user.save(function (err) {
                            if (err)
                                return done(err);
                            return done(null,user);
                        });
                    }
                });
            } else {
                // user is logged in and already has a local account. Ignore signup.
                return done(null, req.user);
            }

        });

    }));

    /*
    **  Facebook
    */
    var fbStrategy = configAuth.facebookAuth;
    fbStrategy.passReqToCallback = true;  // ceck if logged in
    passport.use(new FacebookStrategy(fbStrategy,
    function(req, token, refreshToken, profile, done) {
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        // if there is a user id already but no token
                        if (!user.facebook.token) {
                            user.facebook.token = token;
                            user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                            user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                            user.save(function(err) {
                                if (err)
                                    return done(err);
                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found
                    } else {
                        // if there is no user, create it
                        var newUser            = new User();

                        newUser.facebook.id    = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.facebook.email = (profile.emails[0].value || '').toLowerCase();

                        newUser.save(function(err) {
                            if (err)
                                return done(err);
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user            = req.user;

                user.facebook.id    = profile.id;
                user.facebook.token = token;
                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                user.save(function(err) {
                    if (err)
                        return done(err);
                    return done(null, user);
                });

            }
        });

    }));

    passport.use(new SteamStrategy({
        returnURL: 'http://localhost:8080/connect/steam/return',
        realm: 'http://localhost:8080/',
        apiKey: '06999E88D4E76B19537AFF85E0331D25'
    },
        function(identifier, profile, done) {
            process.nextTick(function () {
                var newUser            = new User();
                profile.identifier = identifier;
                var info = JSON.parse(profile);
                newUser.steamdb.id = info.steamid;
                newUser.steamdb.name = info.personaname;
                newUser.save(function(err) {
                    if (err)
                        return done(err);
                    return done(null, newUser);
                });
                console.log("id = " + info.steamid);
                console.log("name = " + info.personaname);
                return done(null, profile);
            });
        }
        ));
};
