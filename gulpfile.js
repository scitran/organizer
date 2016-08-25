'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');

// Default Task - gulp
gulp.task('default', function() {
  console.log('Gulp works!');
});

// Run Sass - gulp sass
gulp.task('sass', function () {
  return gulp.src('./scss/global.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('./css'));
});

// Sass Live Compiling - gulp sass:watch
gulp.task('sass:watch', function () {
  gulp.watch('./scss/**/*', ['sass']);
});
