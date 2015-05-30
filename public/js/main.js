// Init Socket.IO
var socket = io();

socket.on('file:new', function (fileinfo) {
    console.log('New File: ' + fileinfo.relpath);
});

socket.on('folder:new', function (folderinfo) {
    console.log('New Folder: ' + folderinfo.relpath);
});

socket.on('file:deleted', function (fileinfo) {
    console.log('File Deleted: ' + fileinfo.relpath);
});

socket.on('folder:deleted', function (folderinfo) {
    console.log('Folder Deleted: ' + folderinfo.relpath);
});

socket.on('file:changed', function (folderinfo) {
    console.log("File changed: " + folderinfo.relpath);
});