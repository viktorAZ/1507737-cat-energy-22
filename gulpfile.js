const gulp = require('gulp');
const plumber = require('gulp-plumber');
const sourcemap = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const csso = require('postcss-csso');
const sync = require('browser-sync').create();
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const del = require('del');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const svgstore = require('gulp-svgstore');
const cheerio = require('gulp-cheerio');
const svgStack = require('gulp-svg-sprite');

// HTML

const html = () => {
  return gulp.src('./source/**/*.html')
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('./build'));
}

exports.html = html;

// Styles

const styles = () => {
  return gulp.src('./source/sass/style.{scss,sass}')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(rename('style.min.css'))
    .pipe(sourcemap.write('.'))
    .pipe(gulp.dest('./build/css'))
    .pipe(sync.stream());
}

exports.styles = styles;

// Scripts

const scripts = () => {
  return gulp.src('./source/js/*.{js,jsx}')
    .pipe(terser())
    .pipe(rename('script.min.js'))
    .pipe(gulp.dest('./build/js'))
    .pipe(sync.stream());
}

exports.scripts = scripts;

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: './build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

exports.server = server;

// Images

const optimizeImages = () => {
  return gulp.src('./source/img/**/*.{jpg,png,svg}')
    .pipe(imagemin([
      imagemin.optipng({
        optimizationLevel: 3
      }),
      imagemin.mozjpeg({
        progressive: true
      }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest('./build/img'))
}

exports.images = optimizeImages;

const copyImages = () => {
  return gulp.src('./source/img/**/*.{jpg,png,svg}')
    .pipe(gulp.dest('./build/img'))
}

exports.images = copyImages;

// Webp

const createWebp = () => {
  return gulp.src('./source/img/**/*.{jpg,png}')
    .pipe(webp({
      quality: 90
    }))
    .pipe(gulp.dest('./build/img'))
}

exports.createWebp = createWebp;

// SVGSprite

const sprite = () => {
  return gulp.src('./source/img/icons/*.svg')
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(cheerio({
      run: function ($) {
        $('svg').attr('style', 'display: none;');
      },
      parserOptions: {
        xmlMode: true
      }
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('./build/img'));
}

exports.sprite = sprite;

const svgstack = () => {
  return gulp.src('./source/img/icons/**/*.svg')
    .pipe(plumber())
    .pipe(svgStack({
      mode: {
        stack: {}
      }
    }))
    .pipe(rename('stack.svg'))
    .pipe(gulp.dest('./build/img'));
}

exports.svgstack = svgstack;

//  Copy

const copy = (done) => {
  gulp.src([
    'source/fonts/*.{woff2,woff}',
    'source/*.ico',
    'source/img/**/*.svg',
  ], {
    base: 'source'
  })
    .pipe(gulp.dest('./build'))
  done();
}

exports.copy = copy;

// Clean

const clean = () => {
  return del('./build');
};

exports.clean = clean;

// Reload

const reload = (done) => {
  sync.reload();
  done();
}

// Watcher

const watcher = () => {
  gulp.watch('./source/sass/**/*.{scss,sass}', gulp.series(styles));
  gulp.watch('./source/js/script.js', gulp.series(scripts));
  gulp.watch('./source/*.html', gulp.series(html, reload));
}

// Run build

const build = gulp.series(
  clean,
  copy,
  optimizeImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    sprite,
    svgstack,
    createWebp,
  ),
);

exports.build = build;

// Run default

exports.default = gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    sprite,
    svgstack,
    createWebp,
  ),
  gulp.series(
    server,
    watcher
  )
);
