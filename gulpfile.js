const gulp = require("gulp");

const ts = require("gulp-typescript");
const typescript = require("typescript");
const sourcemaps = require("gulp-sourcemaps");
const del = require("del");
const nls = require("vscode-nls-dev");

const tsProject = ts.createProject("./tsconfig.json", { typescript });

const inlineMap = true;
const inlineSource = false;
const outDest = "out";

const languages = [{ id: "zh-cn", folderName: "chs", transifexId: "zh-hans" }];

const cleanTask = function () {
  return del(["out/**", "package.nls.*.json"]);
};

const addI18nTask = function () {
  return gulp
    .src(["package.nls.json"])
    .pipe(nls.createAdditionalLanguageFiles(languages, "i18n"))
    .pipe(gulp.dest("."));
};

const nlsCompileTask = function () {
  var r = tsProject
    .src()
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .js.pipe(nls.rewriteLocalizeCalls())
    .pipe(nls.createAdditionalLanguageFiles(languages, "i18n", "out"));

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

const buildTask = gulp.series(cleanTask, nlsCompileTask, addI18nTask);

const watchTask = function () {
  buildTask();
  return gulp.watch(["src/**", "i18n/**"], function (cb) {
    buildTask();
    cb();
  });
};

gulp.task("default", buildTask);

gulp.task("build", buildTask);

gulp.task("watch", watchTask);
