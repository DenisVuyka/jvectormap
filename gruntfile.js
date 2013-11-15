module.exports = function (grunt) {
  'use strict';

  var jsFiles = [
  	'jquery-jvectormap.js'
  	, 'jquery-mousewheel.js'
  	, 'lib/jvectormap.js'
  	, 'lib/abstract-element.js'
  	, 'lib/abstract-element.js'
  	, 'lib/abstract-canvas-element.js'
  	, 'lib/abstract-shape-element.js'
  	, 'lib/svg-element.js'
  	, 'lib/svg-group-element.js'
  	, 'lib/svg-canvas-element.js'
  	, 'lib/svg-shape-element.js'
  	, 'lib/svg-path-element.js'
  	, 'lib/svg-circle-element.js'
  	, 'lib/vml-element.js'
  	, 'lib/vml-group-element.js'
  	, 'lib/vml-canvas-element.js'
  	, 'lib/vml-shape-element.js'
  	, 'lib/vml-path-element.js'
  	, 'lib/vml-circle-element.js'
  	, 'lib/vector-canvas.js'
  	, 'lib/simple-scale.js'
  	, 'lib/ordinal-scale.js'
  	, 'lib/numeric-scale.js'
  	, 'lib/color-scale.js'
  	, 'lib/data-series.js'
  	, 'lib/proj.js'
  	, 'lib/world-map.js'
  ];

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				// stripBanners: true,
				// banner: ''
			},
			dist: {
				src: jsFiles,
				dest: 'dist/jquery.jvectormap.js'
			}
		},
		uglify: {
			options: {
				mangle: false,
				banner: '/*\n' +
                '* <%= pkg.name %> v<%= pkg.version %>\n' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
                '* License: MIT\n' +
                '* http://www.opensource.org/licenses/mit-license.php\n' +
                '*/\n'
			},
			dist: {
				files: {
					'dist/jquery.jvectormap.min.js': ['dist/jquery.jvectormap.js']
				}
			}
		},
		cssmin: {
			options: {
				banner: '/*\n' +
                '* <%= pkg.name %> v<%= pkg.version %>\n' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
                '* License: MIT\n' +
                '* http://www.opensource.org/licenses/mit-license.php\n' +
                '*/\n'
			},
			css: {
        src: 'jquery-jvectormap.css',
        dest: 'dist/jquery.jvectormap.min.css'
      }
		}
	});

	// Load tasks
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	// Default task(s).
  grunt.registerTask('default', ['concat', 'uglify', 'cssmin']);
};