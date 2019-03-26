/*
** author: David Goerig
** project: dashboard
** fileuse: setup
*/

/*
**          **** get all the tools we need *****
*/
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

var http = require('http');

var request = require('request');

var server = http.createServer(app);

/*
**           ***** All configuration *******
*/

/*
** connect to our database
*/
mongoose.connect(configDB.url, { useMongoClient: true } );

var widgetschema = new mongoose.Schema({
    widget1: Boolean,
    widget2: Boolean,
    widget3: Boolean,
    widget4: Boolean,
    widget5: Boolean,
    widget6: Boolean,
    widget7: Boolean,
    city: String
})

var widget = mongoose.model('MyWidget', widgetschema);

/*
**  passport configuration
*/
require('./config/passport')(passport);


/*
**            ***** Express configuration *******
*/
/*
**  log every request to the console
*/
app.use(morgan('dev'));
/*
**  Read an parse cookies
*/
app.use(cookieParser());

/*  get html JSON forms
**
*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
**  set EJS to link JSlike page
*/
app.set('view engine', 'ejs');

/*
**  For HASH Passport
*/
app.use(session({
    secret: 'wtf am i supposed to write ???', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
/*
**  persistent login sess
*/
app.use(passport.session());
/*
**  for flash msg stored in sess
*/
app.use(flash());

/*
**  Set up routesss and load it, set up passport too.
*/
require('./app/routes.js')(app, passport);

var meteo_key = 'd408d2b56c694401a5084310181310';
var requestUrl = 'https://api.worldweatheronline.com/premium/v1/weather.ashx?q=';
var endUrl = '+uk&num_of_days=5&tp=24&format=json&key=' + meteo_key;

var SteamApi = require('steam-api');

var steamApiKey ='06999E88D4E76B19537AFF85E0331D25';
const SteamAPI = require('steamapi');
const steamurl = new SteamAPI(steamApiKey);

function dayOfWeekAsString(dayIndex) {
    return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][dayIndex];
}

var createDaySummaryHTML = function(daysWeather) {
    var html;
    html = '<div class="day">' + dayOfWeekAsString(new Date(daysWeather.date).getDay())+ '</div>';
    html += '<div class="celsius">' + daysWeather.maxtempC + 'C | ' + daysWeather.mintempC + 'C</div>';
    return html;
};

var googleKey = "AIzaSyDqX0h2lUE9KRxRZAi-xIM2-mGqBF6TQjY";
const YouTube = require('simple-youtube-api');
const youtube = new YouTube(googleKey);
/**
 * socket.io
 */

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    socket.on('askwidget', function (data) {
        if (data == "meteo") {
                var html;
                var city = "toulouse";
                request(requestUrl + city + endUrl, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var result = JSON.parse(body);
                        var currentWeather = result.data.current_condition;
                        var weeklyWeather = result.data.weather;
                        html = "<div class=\"day\"><h3>" + result.data.request[0].query + "</h3></div>";
                        html += "<div class=\"day\"><p>Current: <strong>" + currentWeather[0].weatherDesc[0].value + "</strong></p></div>";
                        html += "<div class=\"day\"><p>Wind:" + currentWeather[0].winddir16Point + " at " + currentWeather[0].windspeedKmph + " km/h</p></div>";
                        html += "<div class=\"day\"><p>Humidity: " + currentWeather[0].humidity + "</p></div>";
                        weeklyWeather.forEach(function(day) {
                            html += createDaySummaryHTML(day);
                        });
                    } else {
                        html = "<div class=\"day\"><h3>" + "ERROR" + "</h3></div>";
                        console.log(error, response.statusCode, body);
                    }
                    socket.emit('getwidget', html);
                });
        }
        if (data == "meteo_your_city") {
            var html1;
            socket.on('your_city', function (city1) {
                if (city1 == "DB") {
                    city1 = widget.schema.obj.city;
                } else {
                    widget.schema.obj.city = city1;
                }
                request(requestUrl + city1 + endUrl, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var result = JSON.parse(body);
                        var currentWeather = result.data.current_condition;
                        var weeklyWeather = result.data.weather;
                        html1 = "<div class=\"day\"><h3>" + result.data.request[0].query + "</h3></div>";
                        html1 += "<div class=\"day\"><p>Current: <strong>" + currentWeather[0].weatherDesc[0].value + "</strong></p></div>";
                        html1 += "<div class=\"day\"><p>Wind:" + currentWeather[0].winddir16Point + " at " + currentWeather[0].windspeedKmph + " km/h</p></div>";
                        html1 += "<div class=\"day\"><p>Humidity: " + currentWeather[0].humidity + "</p></div>";
                        weeklyWeather.forEach(function(day) {
                            html1 += createDaySummaryHTML(day);
                        });
                    } else {
                        "<div class=\"day\"><h3>" + "ERROR" + "</h3></div>";
                        console.log(error, response.statusCode, body);
                    }
                    socket.emit('getwidget', html1);
                });
            });
        }
        if (data == "get_artist") {
            socket.on('spotArtID', function (name) {
                var html2 = "<div class=\"IDFR\"><h3>Video<h3></div>";
                youtube.searchVideos(name, 4).then(results => {
                    console.log("The video's title is ${results[0].title}");
                    html2 += "<div class=\"video\"><p>" + `The video's title is ${results[0].title}` + "</p></div>";
                    socket.emit('getwidget', html2);
                }).catch(console.log);
            });
        }
        if (data == "get_top_song") {
            socket.on('spotID', function (url) {
                var html3 = "<div class=\"IDFR\"><h3>Playlist<h3></div>";
                youtube.getPlaylist(url).then(playlist => {
                    console.log("The playlist's title is ${playlist.title}");
                    html3 += "<div class=\"playlist\"><p>" + `The playlist's title is ${playlist.title}` + "</p></div>";
                    playlist.getVideos().then(videos => {
                        console.log(`This playlist has ${videos.length === 50 ? '50+' : videos.length} videos.`);
                        html3 += "<div class=\"playlist\"><p>" + `This playlist has ${videos.length === 50 ? '50+' : videos.length} videos.` + "</p></div>";
                        socket.emit('getwidget', html3);
                    }).catch(console.log);
                }).catch(console.log);
            });
        }
        if (data == "steam_player") {
            socket.on('hisIdFriends', function (pseudo) {
                var html4 = "<div class=\"IDFR\"><h3>Friends<h3></div>";
                var friends = [];
                steamurl.resolve('https://steamcommunity.com/id/' + pseudo).then(hisID => {
                    var user = new SteamApi.User(steamApiKey, hisID);
                    user.GetFriendList(optionalRelationship = 'all', hisID).done(function (result) {
                        for (var i = 0; i < result.length; i++) {
                            tmp = {
                                pseudo: result[i].personaName,
                                statu: result[i].personaState
                            };
                            friends.push(tmp);
                        }
                        friends.forEach(function(fr) {
                            html4 += "<div class=\"friends\"><p>" + fr.pseudo + " is " + fr.statu + "</p></div>";
                        });
                        socket.emit('getwidget', html4);
                    });
                });
            });
        }
        if (data == "steam_player_on_game") {
            socket.on('gameId', function (gameID) {
                var html5;
                var userStats = new SteamApi.UserStats(steamApiKey, gameID);
                userStats.GetNumberOfCurrentPlayers(gameID).done(function(result){
                    html5 = "<div class=\"IDFR\"><h3>There is <h3></div>";
                    html5 += "<div class=\"gamers\"><p>" + result + " players" + "</p></div>";
                    html5 += "<div class=\"gamers\"><p>Playing this game</p></div>";
                    socket.emit('getwidget', html5);
                });
            });
        }
        if (data == "steam_player_inv") {
            socket.on('hisIdInv', function (pseudo) {
                steamurl.resolve('https://steamcommunity.com/id/' + pseudo).then(hisID => {
                    var html6;
                    var player = new SteamApi.Player(steamApiKey, hisID);
                    player.GetSteamLevel(hisID).done(function(level){
                        html6 = "<div class=\"ident\"><h3>" + pseudo + "<h3></div>";
                        html6 += "<div class=\"data\"><p>" + "LVL: " + level + "</p></div>";
                            socket.emit('getwidget', html6);
                    });
                });
            });
        }
    });

    socket.on('persistance', function (data) {
        if (data != "getpersist") {
            return ;
        }
        var mypersist = "";
        if (widget.schema.obj.widget1 != true) {
            mypersist += "N";
        } else {
            mypersist += "Y";
        }
        if (widget.schema.obj.widget2 != true) {
            mypersist += "N";
        } else {
            mypersist += "Y";
        }
        if (widget.schema.obj.widget3 != true) {
            mypersist += "N";
        } else {
            mypersist += "N";
            widget.schema.obj.widget3 = false;
        }
        if (widget.schema.obj.widget4 != true) {
            mypersist += "N";
        } else {
            mypersist += "N";
            widget.schema.obj.widget4 = false;
        }
        if (widget.schema.obj.widget5 != true) {
            mypersist += "N";
        } else {
            mypersist += "N";
            widget.schema.obj.widget5 = false;
        }
        if (widget.schema.obj.widget6 != true) {
            mypersist += "N";
        } else {
            mypersist += "N";
            widget.schema.obj.widget6 = false;
        }
        if (widget.schema.obj.widget7 != true) {
            mypersist += "N";
        } else {
            mypersist += "N";
            widget.schema.obj.widget7 = false;
        }
        socket.emit('persistrep', mypersist);
    });

    socket.on('widgetadd', function (data) {
        if (data == "WIDGET1") {
            var temp = false;
            if (widget.schema.obj.widget1 != true) {
                socket.emit('responseadd', 'NOWIDGET');
                temp = true;
            }
            else {
                socket.emit('responseadd', 'YWYDGET');
            }
            if (temp == true) {
                widget.schema.obj.widget1 = true;
            }
        } else if (data == "WIDGET2") {
            var temp = false;
            if (widget.schema.obj.widget2 != true) {
                socket.emit('responseadd', 'NOWIDGET');
                temp = true;
            }
            else {
                socket.emit('responseadd', 'YWYDGET');
            }
            if (temp == true) {
                widget.schema.obj.widget2 = true;
            }
        } else if (data == "WIDGET3") {
            var temp = false;
            if (widget.schema.obj.widget3 != true) {
                socket.emit('responseadd', 'NOWIDGET');
                temp = true;
            }
            else {
                socket.emit('responseadd', 'YWYDGET');
            }
            if (temp == true) {
                widget.schema.obj.widget3 = true;
            }
        } else if (data == "WIDGET4") {
            var temp = false;
            if (widget.schema.obj.widget4 != true) {
                socket.emit('responseadd', 'NOWIDGET');
                temp = true;
            }
            else {
                socket.emit('responseadd', 'YWYDGET');
            }
            if (temp == true) {
                widget.schema.obj.widget4 = true;
            }
        } else if (data == "WIDGET5") {
            var temp = false;
            if (widget.schema.obj.widget5 != true) {
                socket.emit('responseadd', 'NOWIDGET');
                temp = true;
            }
            else {
                socket.emit('responseadd', 'YWYDGET');
            }
            if (temp == true) {
                widget.schema.obj.widget5 = true;
            }
        } else if (data == "WIDGET6") {
            var temp = false;
            if (widget.schema.obj.widget6 != true) {
                socket.emit('responseadd', 'NOWIDGET');
                temp = true;
            }
            else {
                socket.emit('responseadd', 'YWYDGET');
            }
            if (temp == true) {
                widget.schema.obj.widget6 = true;
            }
        } else if (data == "WIDGET7") {
            var temp = false;
            if (widget.schema.obj.widget7 != true) {
                socket.emit('responseadd', 'NOWIDGET');
                temp = true;
            }
            else {
                socket.emit('responseadd', 'YWYDGET');
            }
            if (temp == true) {
                widget.schema.obj.widget7 = true;
            }
        }
        else {
            socket.emit('responseadd', 'ERROR');
        }
    });

    socket.on('widgetdel', function (data) {
        if (data == "WIDGET1") {
            if (widget.schema.obj.widget1 != true) {
                socket.emit('responsedel', 'NOWIDGET');
            }
            else {
                socket.emit('responsedel', 'YWYDGET');
                widget.schema.obj.widget1 = false;
            }
        } else if (data == "WIDGET2") {
            if (widget.schema.obj.widget2 != true) {
                socket.emit('responsedel', 'NOWIDGET');
            }
            else {
                socket.emit('responsedel', 'YWYDGET');
                widget.schema.obj.widget2 = false;
            }
        } else if (data == "WIDGET3") {
            if (widget.schema.obj.widget3 != true) {
                socket.emit('responsedel', 'NOWIDGET');
            }
            else {
                socket.emit('responsedel', 'YWYDGET');
                widget.schema.obj.widget3 = false;
            }
        } else if (data == "WIDGET4") {
            if (widget.schema.obj.widget4 != true) {
                socket.emit('responsedel', 'NOWIDGET');
            }
            else {
                socket.emit('responsedel', 'YWYDGET');
                widget.schema.obj.widget4 = false;
            }
        } else if (data == "WIDGET5") {
            if (widget.schema.obj.widget5 != true) {
                socket.emit('responsedel', 'NOWIDGET');
            }
            else {
                socket.emit('responsedel', 'YWYDGET');
                widget.schema.obj.widget5 = false;
            }
        } else if (data == "WIDGET6") {
            if (widget.schema.obj.widget6 != true) {
                socket.emit('responsedel', 'NOWIDGET');
            }
            else {
                socket.emit('responsedel', 'YWYDGET');
                widget.schema.obj.widget6 = false;
            }
        } else if (data == "WIDGET7") {
            if (widget.schema.obj.widget7 != true) {
                socket.emit('responsedel', 'NOWIDGET');
            }
            else {
                socket.emit('responsedel', 'YWYDGET');
                widget.schema.obj.widget7 = false;
            }
        }
        else {
            socket.emit('responsedel', 'ERROR');
        }
    });
});

/*
** LETS GOOOOOO, if we are here, it lauck.
*/
server.listen(port);
//app.listen(port);
console.log('The dashboard is set. go to localhost:' + port);
