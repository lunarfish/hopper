const gulp = require('gulp');
const sass = require('gulp-sass');
const watch = require('gulp-watch');
const nodemon = require('gulp-nodemon');
const child = require('child_process');
const fs = require('fs');

gulp.task('sass:foundation', function() {
  return gulp.src(['build/scss/*'])
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('assets/foundation/css'));
});

gulp.task('copy:cssgg', function () {
  return gulp.src('node_modules/css.gg/icons/all.scss')
  .pipe(gulp.dest('node_modules/css.gg/import'));
});

gulp.task('icons', function() {
  iconify({
        src: 'node_modules/icomoon/fonts/*.svg',
        scssOutput: 'build/scss',
        styleTemplate: '_icon_gen.scss.mustache'
    });
});

gulp.task('copy:foundation', function () {
  return gulp.src('node_modules/foundation-sites/dist/js/*')
  .pipe(gulp.dest('assets/foundation/js'));
});

gulp.task('develop', function (done) {
  let stream = nodemon(
    {
      script: 'index.js',
      ext: 'js njk scss',
      ignore: ['node_modules/*', 'assets/*'],
      tasks: [
        'copy:cssgg',
        'copy:foundation',
        'sass:foundation'
      ]
    }
  );

  stream
      .on('restart', function () {
        console.log('restarted!')
      })
      .on('crash', function() {
        console.error('Application has crashed!\n')
         stream.emit('restart', 10)  // restart the server in 10 seconds
      });
});

gulp.task('default', gulp.series(
	'develop'
));
