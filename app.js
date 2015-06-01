"use strict";

var http = require("http"),
    express = require('express'),
    path = require('path'),
// var favicon = require('serve-favicon'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    multer = require("multer"),
    sio = require('socket.io'),
    serveStatic = require("serve-static"),
    contentDisposition = require('content-disposition'),
    routes = require('./routes/index'),
    uploadHandler = require('./routes/upload'),
    socketNotifier = require("./socketnotifier"),

    app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.raw({ limit: '50mb' }));
app.use(multer({ dest: './uploads/' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.post('/upload', uploadHandler);

// Set header to force download
function setHeaders(res, path) {
    res.setHeader('Content-Disposition', contentDisposition(path))
}

app.use('/download', serveStatic('/tmp', {
    dotfiles: 'allow',
    index: false,
    setHeaders: setHeaders
}));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) { // jshint ignore:line
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) { // jshint ignore:line
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var server = http.createServer(app),
    io = sio(server);

socketNotifier(io);

module.exports = server;
