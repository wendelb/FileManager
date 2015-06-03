"use strict";

/* global unescape: false */
var fs = require("fs"),
    path = require("path");

function uploadHandler(req, res) {
    // Absicherung: Nur Fildrop darf das hier
    if (
        (!req.is('application/octet-stream')) ||
        (req.header('X-Requested-With') !== "FileDrop-XHR-FileAPI") ||
        (typeof req.query.path == 'undefined')
    ) {
        res.status(404).send("Not found");
        return;
    }

    var folder = path.join(process.argv[2], unescape(req.query.path.substring(1))),
        filename = unescape(req.header('X-File-Name'));

    console.log("Folder", "Filename");
    console.log(folder, filename);

    // Existiert der Pfad?
    fs.stat(folder, function (err, stat) {
        if (err) {
            res.status(403).send("Path not found");
            return;
        }

        // Ist er auch ein Verzeichnis?
        if (!stat.isDirectory()) {
            res.status(403).send("Path not a directory");
            return;
        }

        // Alles OK, jetzt die Datei anlegen und schreiben
        fs.writeFile(path.join(folder, filename), req.body, function (err) {
            if (err) {
                res.status(500).send("Internal server error");
                console.log(err);
                return;
            }

            res.send("OK");
        });
    });
}

exports = module.exports = uploadHandler;