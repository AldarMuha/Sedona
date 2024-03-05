import gulp from 'gulp';
import plumber from 'gulp-plumber';
import less from 'gulp-less';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import browser, { create } from 'browser-sync';
import csso from 'postcss-csso';
import htmlmin from 'gulp-htmlmin';
import rename from 'gulp-rename';
import terser from 'gulp-terser';
import imagemin from 'gulp-imagemin';
import sourcemap from 'gulp-sourcemaps';
import webp from 'gulp-webp';
import svgstore from 'gulp-svgstore';
import { deleteAsync } from 'del';

// Styles

export const styles = () => {
  return gulp.src('source/less/style.less')
    .pipe(plumber()) // style.less->style.less смотрит, есть ли ошибки, сборка не ломается, продолжает работать, но передает ошибку дальше, показывает в консоли
    .pipe(sourcemap.init()) // [style.less](1)  sourcemap запоминает какие стили в каких исходных less файлах находятся
    .pipe(less()) // style.less -> style.css
    .pipe(postcss([  // style.css -> style.css[prefix]
      autoprefixer(),
      csso() //style.css[prefix, min] //минификация файла style.css
    ]))
    .pipe(rename('style.min.css')) // переименовали style.css в style.min.css
    .pipe(sourcemap.write('.')) // [style.css[prefix]](2) sourcemap запомнил все ходы превращения style.less в style.css[prefix] 
    .pipe(gulp.dest('build/css')) // кладет style.css[prefix] в папку source/css
    .pipe(browser.stream()); // перезапускаем работу сервера
}

//HTML

export const html = () => {
  return gulp.src('source/*.html')
    .pipe(htmlmin({ collapseWhitespace: true })) // CollapseWhitespace сворачивает пробелы больше одного в один
    .pipe(gulp.dest('build')); // добавляет измененный файл в папку build
}

//Scripts

export const scripts = () => {
  return gulp.src('source/js/script.js')
    .pipe(terser())  // минифицируем script.js
    .pipe(rename('script.min.js')) // переименовываем
    .pipe(gulp.dest('build/js'));
}

//Images

export const optimizeImages = () => {
  return gulp.src('source/img/**/*.{jpg,png,svg}')
    .pipe(imagemin())
    .pipe(gulp.dest('build/img'));
}

export const copyImages = () => {
  return gulp.src('source/img/**/*.{jpg,png,svg}')
    .pipe(gulp.dest('build/img'));
}

//Webp

export const createWebp = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
    .pipe(webp({ quality: 90 }))
    .pipe(gulp.dest('build/img'));
}

//Sprite

export const sprite = () => {
  return gulp.src('source/img/icons/*.svg')
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/img'));
}

//Copy

export const copy = (done) => {
  gulp.src([
    'source/fonts/*.{woff2,woff}',
    'source/img/**/*.svg',
    '!source/img/icons/*.svg',
  ], {
    base: 'source'
  })
    .pipe(gulp.dest('build'))
  done();
}

//Clean

export const clean = () => {
  return deleteAsync(['build']);
}

// Server

const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build' // server запустись и смотри в папку source
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

// Watcher

const watcher = () => { //watcher программа которая следит за изменеиями в файлах и обновляют страницу
  gulp.watch('source/less/**/*.less', gulp.series(styles)); // как только что то изменишь в этих файлах и сохранишь, запусти задачу styles
  gulp.watch('source/js/*.js', gulp.series(scripts));
  gulp.watch('source/*.html').on('change', browser.reload); // как только что то изменится в html файлах перезагрузи страницу
}

//Build

export const build = gulp.series(
  clean,
  copy,
  optimizeImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    sprite,
    createWebp
  ),

);

export default gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    sprite,
    createWebp
  ),
  gulp.series(
    server,
    watcher,
  )
);
