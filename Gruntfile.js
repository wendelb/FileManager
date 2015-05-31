'use strict';

module.exports = function (grunt) {

    // load the plugins.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks("grunt-jscs");

    // project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // JS-Development
        jshint: {
            allFiles: ['*.js', 'routes/*.js', 'public/js/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        jscs: {
            src: ['*.js', 'routes/*.js', 'public/js/*.js'],
            options: {
                config: '.jscsrc'
            }
        }
    });

    // configure tasks.
    // Development-Tasks
    grunt.registerTask('default', ['hint', 'cs']);
    grunt.registerTask('hint', ['jshint']);
    grunt.registerTask('cs', ['jscs']);
};