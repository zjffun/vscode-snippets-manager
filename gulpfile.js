const gulp = require("gulp");

const ts = require("gulp-typescript");
const typescript = require("typescript");
const sourcemaps = require("gulp-sourcemaps");
const del = require("del");

const tsProject = ts.createProject("./tsconfig.json", { typescript });

const inlineMap = true;
const inlineSource = false;
const outDest = "out";

const languages = [{ id: "zh-cn", folderName: "chs", transifexId: "zh-hans" }];

const cleanTask = function () {
  return del(["out/**"]);
};

const compileTask = function () {
  var r = tsProject
    .src()
    .pipe(sourcemaps.init())
    .pipe(tsProject());

  if (inlineMap && inlineSource) {
    r = r.pipe(sourcemaps.write());
  } else {
    r = r.pipe(
      sourcemaps.write("../out", {
        // no inlined source
        includeContent: inlineSource,
        // Return relative source map root directories per file.
        sourceRoot: "../src",
      })
    );
  }

  return r.pipe(gulp.dest(outDest));
};

const buildTask = gulp.series(cleanTask, compileTask);

const watchTask = function () {
  buildTask();
  return gulp.watch(["src/**"], function (cb) {
    buildTask();
    cb();
  });
};

gulp.task("default", buildTask);

gulp.task("build", buildTask);

gulp.task("watch", watchTask);
