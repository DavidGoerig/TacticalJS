/*
** author: David Goerig
** project: dashboard
** fileuse: set up routes
*/

/*
**          **** get setup for passports*****
*/

module.exports = function(app, passport) {

/*
**          **** classic routes *****
*/

/*
**  HOME page
*/
app.get('/', function(req, res) {
    res.render('index.ejs');
})
/*
**  profile page
*/
.get('/profile', isLoggedIn, function(req, res) {
    res.render('profile.ejs', {
        user : req.user
    });
})
.get('/about.json', function(req, res, next) {
	res.setHeader('Content-Type', '	application/json');
	var UnixTime = Math.floor(Date.now() / 1000);

	aboutObj = {
		client: {
			host: req.connection.remoteAddress
		},
		server: {
			current_time: UnixTime,
			services: [{
				"name": "Youtube",
				"widgets": [{
					"name": "Looking for a video",
					"description": "Display informations about a video",
					"params": [{
						"name": "String"
					}]
				}, {
					"name": "Looking for a playlist",
					"description": "Display informations about a playlist",
					"params": [{
						"name": "String"
					}]
				}]
			}, {
				"name": "Steam",
				"widgets": [{
					"name": "Get friend list",
					"description": "Get friend list",
					"params": [{
						"account_name": "String"
					}, {
                        "name": "Get player online",
                        "description": "Get player online",
                        "params": [{
                            "game_id": "String"
                        }]
                    }, {
                        "name": "Get friend level",
                        "description": "Get friend level",
                        "params": [{
                            "acc_name": "String"
                        }]
                    }]
				}]
			}, {
				"name": "Weather",
				"widgets": [{
					"name": "Local weather",
					"description": "Give information on the local weather over the week.",
					"params": [{}]
				},{
					"name": "Somewhere weather",
					"description": "Give information on the weather over the week.",
					"params": [{
                        "city": "String"
                    }]
				}]
            },
            {
				"name": "Facebook",
				"widgets": [{
					"name": "NO WIDGET",
					"description": "Only for passport connection"
				}]
            }
        ]
		}
	};
	res.send(aboutObj);
})
/*
**  HOME page
*/
.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

/*
**          **** first auths *****
*/

/*
**  show the login form
*/
app.get('/login', function(req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
})
/*
**  process of the login with post request
*/
.post('/login', passport.authenticate('local-login', {
/*
**  redirect to the wanted profile section (here dashboard at the end)
*/
//TODO: change profile to dashboard
    successRedirect : '/profile',
/*
**  if it fail -> login page
*/
    failureRedirect : '/login',
    failureFlash : true
}));

/*
**          **** SIGN UP *****
*/
// show the signup form
app.get('/signup', function(req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
});

// process the signup form
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

// facebook -------------------------------

// send to facebook to do the authentication
app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['public_profile', 'email'] }));

        // handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect : '/profile',
        failureRedirect : '/'
}));

/*
**          **** autorization when u r loged in *****
*/

    // locally --------------------------------
app.get('/connect/local', function(req, res) {
    res.render('connect-local.ejs', { message: req.flash('loginMessage') });
});
app.post('/connect/local', passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

    // facebook -------------------------------

        // send to facebook to do the authentication
app.get('/connect/facebook', passport.authorize('facebook', { scope : ['public_profile', 'email'] }));

        // handle the callback after facebook has authorized the user
app.get('/connect/facebook/callback',
    passport.authorize('facebook', {
        successRedirect : '/profile',
        failureRedirect : '/'
}));

// steam -------------------------------

//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Steam authentication will involve redirecting
//   the user to steamcommunity.com.  After authenticating, Steam will redirect the
//   user back to this application at /auth/steam/return
    app.get('/connect/steam',
        passport.authenticate('steam', { failureRedirect: '/' }),
        function(req, res) {
            res.redirect('/profile');
        });

//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
    app.get('/connect/steam/return',
        function(req, res, next) {
            req.url = req.originalUrl;
            next();
        },
        passport.authenticate('steam', { failureRedirect: '/' }),
        function(req, res) {
            res.redirect('/profile');
        });

/*
**          **** unlink account *****
*/

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
