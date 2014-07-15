// Generated on 2013-10-28 using generator-tvengine 0.1.0
/* jshint node: true */
'use strict';

var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({
    port: LIVERELOAD_PORT,
    excludeList: ['.zip']
});
var mountFolder = function(connect, dir) {
    return connect.static(require('path').resolve(dir));
};



var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;



module.exports = function(grunt) {

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);



    var loadProxies = function() {
        var requirejs = require('requirejs');
        requirejs.config({
            baseUrl: __dirname,
            nodeRequire: require
        });
        var proxyConfig = requirejs('public/js/proxyconfig');
        var proxies = proxyConfig.proxies || [];
        return proxies.map(function(p) {
            var rw = {};
            rw['^/' + p.path] = '';
            return {
                context: '/' + p.path,
                host: p.domain,
                port: 80,
                https: false,
                changeOrigin: true,
                rewrite: rw
            }
        });
    }

    var yeomanConfig = {
        app: 'public',
        tmp: '.tmp',
        dist: 'build',
        external_ip: '192.168.0.50',
        widgetfile: 'Widget/news_max_0.0.0_' + grunt.template.date(new Date(), 'yyyymmdd') + '.zip'
    }

    grunt.initConfig({
        yeoman: yeomanConfig,
        requirejs: {
            compile: {
                options: {
                    appDir: '<%= yeoman.app %>',
                    baseUrl: 'js',
                    modules: [{
                        name: "application"
                    }],
                    optimize: 'none',
                    removeCombined: true,
                    mainConfigFile: "<%= yeoman.app %>/js/application.js",
                    dir: '<%= yeoman.dist %>'
                }
            }
        },
        imagemin: {
            dist: {
                options: { // Target options
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg,gif}',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        cssmin: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/css/style.css': [
                        '.tmp/styles/{,*/}*.css',
                        '<%= yeoman.app %>/css/{,*/}*.css'
                    ]
                }
            }
        },
        clean: {
            dist: ['<%= yeoman.tmp %>', '<%= yeoman.dist %>/*'],
            tmp: ['<%= yeoman.tmp %>'],
            post_build_cleanup: ['<%= yeoman.dist %>/_widgetlist.xml', '<%= yeoman.dist %>/js/lib/vendor'],
            samsung: ['<%= yeoman.dist %>/widgetlist.xml', '<%= yeoman.dist %>/Widget']
        },
        bower: {
            target: {
                rjsConfig: '<%= yeoman.app %>/js/application.js',
                baseUrl: '<%= yeoman.app %>/js'
            }
        },
        watch: {
            options: {
                nospawn: true,
                livereload: LIVERELOAD_PORT
            },
            livereload: {
                files: [
                    '<%= yeoman.app %>/**/*.js',
                    '<%= yeoman.app %>/index.html',
                    '<%= yeoman.app %>/views/**/*.html',
                    '<%= yeoman.app %>/**/*.css',
                    '<%= yeoman.app %>/**/*.hbs'
                ],
                tasks: ['build:samsung:dev']
            },
            sass: {
                files: ['<%= yeoman.app %>/css/{,*/}*.{scss,sass}'],
                tasks: ['sass'],
                options: {
                    nospawn: true
                },
            }

        },
        connect: {
            options: {
                port: grunt.option('port') || 8001,
                // change this to '0.0.0.0' to access the server from outside
                hostname: grunt.option('ip') || '0.0.0.0'
            },
            buildserver: {
                options: {
                    middleware: function(connect) {
                        return [
                            mountFolder(connect, './build'),
                            proxySnippet
                        ];
                    },
                    keepalive: true
                }
            },
            livereload: {
                options: {
                    middleware: function(connect) {
                        return [
                            proxySnippet,
                            lrSnippet,
                            mountFolder(connect, './public')
                        ];
                    }
                }
            },
            devserver: {
                options: {
                    middleware: function(connect) {
                        return [
                            mountFolder(connect, './public'),
                            proxySnippet
                        ];
                    },
                    keepalive: true
                }
            },
            proxies: loadProxies() // Want to share this config between this and the client app.
        },
        sass: {
            main: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/css',
                    src: ['*.scss'],
                    dest: '<%= yeoman.app %>/css',
                    ext: '.css'
                }]
            }

        },
        open: {
            server: {
                path: 'http://<%= connect.options.hostname %>:<%= connect.options.port %>',
                app: 'safari'
            }
        },
        forever: {
            options: {
                index: 'server.js',
                logDir: 'logs'
            }
        },
        copy: {
            tmpbuild: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/',
                    src: ['**'],
                    dest: '<%= yeoman.tmp %>'
                }]
            }
        },
        compress: {
            samsung: {
                options: {
                    archive: yeomanConfig.dist + "/" + yeomanConfig.widgetfile,
                    mode: "zip"
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>/',
                    src: ['**']
                }]
            }
        },
        template: {
            widgetlist: {
                options: {
                    data: {
                        ip: grunt.option('ip') ? grunt.option('ip') // Force from comand line
                        : ipaddress() // Try to fetch
                        ? ipaddress() : '<%= yeoman.external_ip %>', // Failover to config.
                        widgetfile: yeomanConfig.widgetfile,
                        size: require('grunt-contrib-compress/tasks/lib/compress')(grunt).getSize(yeomanConfig.dist + "/" + yeomanConfig.widgetfile, false)
                    }
                },
                files: {
                    '<%= yeoman.dist %>/widgetlist.xml': ['<%= yeoman.app %>/_widgetlist.xml']
                }
            }
        }
    });
    grunt.registerTask('build:samsung', ['clean:samsung', 'compress:samsung', 'template:widgetlist'])
    grunt.registerTask('build', ['bower', 'sass', 'clean:dist', 'requirejs', 'imagemin', 'cssmin', 'clean:post_build_cleanup', 'build:samsung']);
    grunt.registerTask('server:dev', ['bower', 'sass', 'configureProxies', 'connect:livereload', 'open', 'watch']);
    grunt.registerTask('server', ['build', 'configureProxies', 'connect:buildserver', 'open']);
    grunt.registerTask('server:restart', ['configureProxies', 'connect:buildserver', 'open']);
    grunt.registerTask('default', ['bower', 'sass']);
    grunt.registerTask('proserve', ['build', 'forever:start'])
    grunt.registerTask('testproxyconfig', function() {
        console.log(loadProxies());
    })
};
var ipaddress = function() {
    var os = require('os');
    var ifaces = os.networkInterfaces(),
        addy;
    for (var dev in ifaces) {
        ifaces[dev].forEach(function(details) {
            if (details.family == 'IPv4' && details.internal == false) {
                addy = details.address;
            }
        });
    }
    return addy;
}
