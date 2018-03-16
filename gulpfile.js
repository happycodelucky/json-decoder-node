"use strict";

//******************************************************************************
//* DEPENDENCIES
//******************************************************************************

// // Enable ES6
// require("harmonize")(["harmony", "harmony-proxies", "harmony_proxies"]);

const gulp        = require("gulp"),
      gulpTslint  = require("gulp-tslint"),
      tslint      = require("tslint"),
      tsc         = require("gulp-typescript"),
      sourcemaps  = require("gulp-sourcemaps"),
      // uglify      = require("gulp-uglify"),
      // rename      = require("gulp-rename"),
      // runSequence = require("run-sequence"),
      // mocha       = require("gulp-mocha"),
      // nyc         = require("gulp-nyc"),
      del         = require('del'),
      typescript  = require('typescript');

//
// Correctness tasks
//

//
// Clean
//

gulp.task("clean", function() {
    return del([
        "lib",
        "es",
        "dts",
        "build",
        "coverage"
    ]);
});


// //
// // Build tasks
// //

// const config = require('./tsconfig.json')
// const vscodeTypeScriptProject = tsc.createProject("tsconfig.json", { 
//   typescript
// });

// gulp.task("build-vscode", function() {
//     return gulp
//         .watch(config.include, 
//             vscodeTypeScriptProject
//                 .src()
//                 .pipe(vscodeTypeScriptProject())
//                 .js.pipe(gulp.dest("lib")));
// });

//
// CommonJS (aka Node)
//

const tsCommonJsProject = tsc.createProject("tsconfig.json", {
    module : "commonjs", 
    typescript: require("typescript") 
});

gulp.task("build-lib", function() {
    return tsCommonJsProject
    .src()
    .pipe(tsCommonJsProject())
    .on("error", function (err) {
        process.exit(1);
    })
    .js.pipe(gulp.dest("lib"));
});

//
// Typescript DTS declaration file generation
//
const tsDtsProject = tsc.createProject("tsconfig.json", {
  declaration: true,
  noResolve: false,
  typescript: require("typescript") 
});

gulp.task("build-dts", function() {
    return gulp.src([
        "src/**/*.ts"
    ])
    .pipe(tsDtsProject())
    .on("error", function (err) {
        process.exit(1);
    })
    .dts.pipe(gulp.dest("dts"));
});