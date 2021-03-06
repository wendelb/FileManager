﻿"use strict";

var Watcher = require("./file-notifier"),
    debug = require("debug")("FileManager:Socket"),
    fs = require("fs"),
    path = require("path"),
    excludeRegex = /^(sh\-thd\-(.*)|\.)/;

function notifier(io) {
    var watchdog = new Watcher(process.argv[2]);
    watchdog.init();

    io.on('connection', function (socket) {
        debug('A Client connected');

        socket.on('init', function () {
            // Run the init process
            var folders = watchdog.list();

            for (var i in folders) { // jshint loopfunc: true
                if (folders.hasOwnProperty(i)) {
                    watchdog.getBaseFileInfo(folders[i], function (err, result) {
                        socket.emit('folder:new', result);

                        // Now iterate over all the files and send them, too.
                        // Start by reading the directory
                        var files = fs.readdirSync(folders[i]);

                        // Now iterate over all entries
                        for (var x = 0; x < files.length; x++) {

                            if (!excludeRegex.test(files[x])) {
                                // Is this a file or a folder?
                                var data = fs.statSync(path.join(folders[i], files[x]));
                                if (!data.isDirectory()) {
                                    // and send!
                                    watchdog.getFileInfo(path.join(folders[i], files[x]), function (err, result2) {
                                        socket.emit("file:new", result2);
                                    });
                                }
                            }
                        }
                    });
                }
            }
        });

        socket.on('disconnect', function () {
            debug("A Client disconnected");
        });
    });

    watchdog.on("file:new", function (data) {
        debug("file:new");
        io.emit("file:new", data);
    });

    watchdog.on("folder:new", function (data) {
        debug("folder:new");
        io.emit("folder:new", data);
    });

    watchdog.on("file:deleted", function (data) {
        debug("file:deleted");
        io.emit("file:deleted", data);
    });

    watchdog.on("folder:deleted", function (data) {
        debug("folder:deleted");
        io.emit("folder:deleted", data);
    });

    watchdog.on("file:changed", function (data) {
        debug("file:changed");
        io.emit("file:changed", data);
    });
}

module.exports = notifier;