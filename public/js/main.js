'use strict';

// JSHint globale Variablen setzen
/* global fd: false */
/* global angular: false */
/* global io: false */
/* global Folder: false */

// Filedrop in den jQuery-Modus umschalten
fd.logging = false;
fd.jQuery();

angular.module('filemanager', ['angular-humanize', 'ui.bootstrap'])
.config(function () {
})
.factory('socket', function ($rootScope) {
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
})
.factory('uploader', function () {

})
.directive('folderTree', function ($compile, uploader) {
    return {
        restrict: 'EA',
        scope: {
            folder: "="
        },
        link: function (scope, element, attrs) {
            var dropzone, droptimer = false;

            scope.expanded = false;

            scope.toggle = function () {
                scope.expanded = !scope.expanded;
            };

            var template = '<td colspan="3"><span ng-hide="expanded" class="glyphicon glyphicon-chevron-right"></span><span ng-show="expanded" class="glyphicon glyphicon-chevron-down"></span><span ng-click="toggle()">{{folder.name}}</span>' +
                '<table ng-show="expanded" class="table table-striped table-hover">' +
                '<tr class="upload-zone" style="display: none;"><td colspan="3"><div>Upload here...</div></td></tr>' +
                '<tr folder-tree ng-repeat="item in folder.subfolders | orderBy:\'name\'" folder="item"></ng-sparkline>' +
                '<tr class="file" ng-repeat="item in folder.files | orderBy:\'filename\'"><td>{{item.filename}}</td><td>{{item.size | humanizeFilesize}}</td><td>{{item.lastModified | date:\'dd.MM.yyyy HH:mm\'}}</td></tr>' +
                '</table></td>';

            // Rendering template.
            element.html('').append($compile(template)(scope));

            // Get the dropzone
            dropzone = element.find('td > table .upload-zone');

            // Show dropzone on drag and hide afterwards
            element.on('dragover', function (e) {
                if (e.originalEvent.dataTransfer.types !== null) {
                    dropzone.show();
                    clearTimeout(droptimer);
                }
            })
            .on('dragleave', function (e) {
                droptimer = setTimeout(function () {
                    dropzone.hide();
                }, 2000);
            });

            element.find("td > table .upload-zone > td").filedrop()
            // jQuery always passes event object as the first argument.
            .on('fdsend', function (e, files) {
                files.each(function (file) {
                    uploader.add(file, scope.folder.path);

                    // Start the upload
                    file.sendTo('upload?path=' + scope.folder.path);
                });

            })
            .on('filedone', function (e, file) {
                // alert('Done uploading ' + file.name + ' on ' + scope.folder.path);
            });
        }
    };
})
.controller('MainCtrl', function ($scope, $http, socket) {
    window.scope = $scope;
    $scope.rootFolder = new Folder("", "");

    socket.on('connect', function () {
        socket.emit("init");
    });

    socket.on('file:new', function (fileinfo) {
        $scope.rootFolder.addFileFullName(fileinfo);
    });

    socket.on('folder:new', function (folderinfo) {
        if (folderinfo.relpath !== '') {
            $scope.rootFolder.addFolderFullName(folderinfo.relpath);
        }
    });

    socket.on('file:deleted', function (fileinfo) {
        $scope.rootFolder.deleteFileFull(fileinfo.relpath);
    });

    socket.on('folder:deleted', function (folderinfo) {
        $scope.rootFolder.deleteFolder(folderinfo.relpath);
    });

    socket.on('file:changed', function (fileinfo) {
        $scope.rootFolder.addFileFullName(fileinfo);
    });
})
.controller('UploadController', function () {

});