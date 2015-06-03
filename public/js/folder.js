"use strict";

function Folder(name, path) {
    this.name = name;
    this.subfolders = [];
    this.files = [];
    this.path = path;
    this.isRoot = (name == '');
}

Folder.prototype.addFile = function (file) {
    this.files.push(file);
};

Folder.prototype.addFolder = function (folder) {
    this.subfolders.push(folder);
};

Folder.prototype.addFolderFullName = function (folder) {
    var fullname = folder.split("/");
    // Es gibt keine tieferen Verzweigungen
    if (fullname.length === 1) {

        // Zunächst prüfen, ob der Ordner bereits existiert
        for (var i = 0; i < this.subfolders.length; i++) {
            if (this.subfolders[i].name === folder) {
                return;
            }
        }

        // Ordner existiert noch nicht -> erstellen
        var newFolder = new Folder(folder, this.path + "/" + folder);
        // und in die Liste einfügen
        this.addFolder(newFolder);
    }
    else {
        // Es gibt tiefere Strukturen
        var lastPart = fullname.splice(1).join("/"),
            firstPart = fullname[0];

        // Richtigen Ordner raussuchen und der Unterstruktur die Bearbeitung übergeben
        for (var x = 0; x < this.subfolders.length; x++) {
            if (this.subfolders[x].name === firstPart) {
                this.subfolders[x].addFolderFullName(lastPart);
                return;
            }
        }
    }
};

Folder.prototype.addFileFullName = function (file) {
    file.structureKey = file.structureKey || file.relpath;

    var filename = file.structureKey,
        fullname = filename.split("/");

    // Es gibt keine tieferen Verzweigungen
    if (fullname.length === 1) {

        // Zunächst prüfen, ob die Datei bereits existiert
        for (var i = 0; i < this.files.length; i++) {
            if (this.files[i].filename === filename) {
                // Wenn ja, dann einfach nur updaten
                this.files[i] = file;
                return;
            }
        }

        // Ansonsten erstellen
        this.addFile(file);
    }
    else {
        // Es gibt tiefere Strukturen
        var lastPart = fullname.splice(1).join("/"),
            firstPart = fullname[0];

        // Richtigen Ordner raussuchen und der Unterstruktur die Bearbeitung übergeben
        for (var x = 0; x < this.subfolders.length; x++) {
            if (this.subfolders[x].name === firstPart) {
                // Hinweis an die Unterstruktur: Wir haben uns bereits um unseren Teil gekümmert.
                file.structureKey = lastPart;
                this.subfolders[x].addFileFullName(file);
                return;
            }
        }
    }
};

Folder.prototype.deleteFileFull = function (filename) {
    var fullname = filename.split("/");

    // Es gibt keine tieferen Verzweigungen -> unsere Datei
    if (fullname.length === 1) {

        // Datei suchen...
        for (var i = 0; i < this.files.length; i++) {
            if (this.files[i].filename === filename) {
                // ... und entfernen
                this.files.splice(i, 1);
                return;
            }
        }
    }
    else {
        // Es gibt tiefere Strukturen
        var lastPart = fullname.splice(1).join("/"),
            firstPart = fullname[0];

        // Richtigen Ordner raussuchen und der Unterstruktur die Bearbeitung übergeben
        for (var x = 0; x < this.subfolders.length; x++) {
            if (this.subfolders[x].name === firstPart) {
                // Hinweis an die Unterstruktur: Wir haben uns bereits um unseren Teil gekümmert.
                this.subfolders[x].deleteFileFull(lastPart);
                return;
            }
        }
    }
};

Folder.prototype.destroy = function () {
    this.files = [];
    this.name = "";
    this.path = "";

    for (var i = 0; i < this.subfolders.length; i++) {
        this.subfolders[i].destroy();
    }

    this.subfolders = [];
};

Folder.prototype.deleteFolder = function (folder) {
    var fullname = folder.split("/");
    // Es gibt keine tieferen Verzweigungen
    if (fullname.length === 1) {

        // Ordner finden
        for (var i = 0; i < this.subfolders.length; i++) {
            if (this.subfolders[i].name === folder) {
                // und entsorgen
                this.subfolders[i].destroy();
                this.subfolders.splice(i, 1);

                return;
            }
        }
    }
    else {
        // Es gibt tiefere Strukturen
        var lastPart = fullname.splice(1).join("/"),
            firstPart = fullname[0];

        // Richtigen Ordner raussuchen und der Unterstruktur die Bearbeitung übergeben
        for (var x = 0; x < this.subfolders.length; x++) {
            if (this.subfolders[x].name === firstPart) {
                this.subfolders[x].deleteFolder(lastPart);
                return;
            }
        }
    }
};