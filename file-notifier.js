"use strict";

var EventEmitter = require("events").EventEmitter,
    Inotify = require("inotify").Inotify,
    inotify = new Inotify(),
    util = require("util"),
    path = require("path"),
    fs = require("fs"),
    debug = require("debug")("FileManager:FileNotifier"),
    debug_scan = require("debug")("FileManager:FileNotifier:scandir"),
    excludeRegex = /^sh\-thd\-(.*)/;

function Watcher(base_directory) {
    this.base_directory = path.normalize(base_directory);
    this.hashtable = {};
    debug("Home directory: " + base_directory);
}

// Add Events to the Watcher
util.inherits(Watcher, EventEmitter);

Watcher.prototype.init = function () {
    this.add_Watch(this.base_directory);
    console.log(this);

    var folders = this.scandirSync(this.base_directory);
    if (folders.length !== 0) {
        for (var i = 0; i < folders.length; i++) {
            this.add_Watch(folders[i]);
        }
    }
};

Watcher.prototype.getFileInfo = function (fullpath, cb) {
    var result = {};
    result.fullpath = fullpath;
    result.relpath = fullpath.substring(this.base_directory.length);

    fs.stat(fullpath, function (err, stat) {
        if (err) {
            cb(err, null);
            return;
        }

        result.size = stat.size;
        result.lastModified = stat.mtime;

        cb(null, result);
    });
};

Watcher.prototype.getBaseFileInfo = function (fullpath, cb) {
    var result = {};
    result.fullpath = fullpath;
    result.relpath = fullpath.substring(this.base_directory.length);
    result.site = 0;
    result.lastModified = 0;

    cb(null, result);
};

Watcher.prototype.add_Watch = function (directory) {
    var self = this;
    debug("Add new watch for " + directory);

    var inotify_Callback = function (event) {
        var mask = event.mask,
            fullpath = path.normalize(path.join(self.hashtable[event.watch], event.name || ''));

        if (excludeRegex.test(event.name)) {
            return;
        }


        if (mask & Inotify.IN_CLOSE_WRITE) {
            // A file has changed
            debug("File opened was closed: " + fullpath);
            self.getFileInfo(fullpath, function (err, result) {
                if (!err) {
                    self.emit("file:changed", result);
                }
            });
        }
        else if (mask & Inotify.IN_CREATE) {
            // There is something new
            if (mask & Inotify.IN_ISDIR) {
                debug("New folder: " + fullpath);
                self.add_Watch(fullpath);
                self.getBaseFileInfo(fullpath, function (err, result) {
                    self.emit("folder:new", result);
                });
            }
            else {
                debug("New file: " + fullpath);
                self.getFileInfo(fullpath, function (err, result) {
                    if (!err) {
                        self.emit("file:new", result);
                    }
                });
            }
        }
        else if (mask & Inotify.IN_DELETE) {
            // Something was deleted
            if (mask & Inotify.IN_ISDIR) {
                // Folder deleted
                self.deleteHashtable(fullpath);
                self.getBaseFileInfo(fullpath, function (err, result) {
                    self.emit("folder:deleted", result);
                });
            }
            else {
                // File deleted
                self.getBaseFileInfo(fullpath, function (err, result) {
                    self.emit("file:deleted", result);
                });
            }
        }
    },
    watch = {
        path: directory,
        watch_for: Inotify.IN_ALL_EVENTS,
        callback: inotify_Callback
    },
    watch_fd = inotify.addWatch(watch);

    this.hashtable[watch_fd] = directory;
    //console.log(this.hashtable);
    return watch_fd;
};

Watcher.prototype.scandirSync = function (directory) {
    var files = fs.readdirSync(directory),
        directories = [];

    for (var i in files) {
        if (files.hasOwnProperty(i)) {
            var name = path.normalize(path.join(directory, files[i]));
            if (fs.statSync(name).isDirectory()) {
                debug_scan("Found folder: " + name);
                directories.push(name);
                directories = directories.concat(this.scandirSync(name));
            }
        }
    }

    return directories;
};

Watcher.prototype.count = function () {
    var size = 0;
    for (var key in this.hashtable) {
        if (this.hashtable.hasOwnProperty(key)) {
            size++;
        }
    }
    return size;
};

Watcher.prototype.list = function () {
    return this.hashtable;
};

Watcher.prototype.deleteHashtable = function (value) {
    for (var key in this.hashtable) {
        if (this.hashtable.hasOwnProperty(key)) {
            if (this.hashtable[key] === value) {
                delete this.hashtable[key];
            }
        }
    }
};

exports = module.exports = Watcher;