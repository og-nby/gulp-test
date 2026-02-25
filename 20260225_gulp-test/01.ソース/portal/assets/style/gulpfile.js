// gulpプラグインの読み込み
const { src, dest, watch, series } = require('gulp');

// Sassをコンパイルするプラグインの読み込み
// v5 以降の gulp‑sass はファクトリ関数として動作し、内部で Dart Sass をバインドします。
const sass = require('gulp-sass')(require('sass'));
// 文字コード変換用（タブ変換に使用）
const through = require('through2');
// ベンダープレフィックス自動付与
const autoprefixer = require('gulp-autoprefixer');
// css圧縮プラグイン
const comp = require('gulp-clean-css');
const vmRenameFile = require("gulp-rename");
// 改行コード変換プラグイン
const gulpLoadPlugins = require ('gulp-load-plugins');   
const linePlugins = gulpLoadPlugins(); 
// fibers は Dart Sass v1.33 以降では不要なため読み込みを削除
// 処理を一つタスクにまとめるためのプラグイン
//const merge = require('merge-stream');
// コンパイルエラー検知 強制終了防止
const plumber = require('gulp-plumber');
// デスクトップ通知
const notify = require('gulp-notify');
// css整形
var csscomb = require("gulp-csscomb");
const gulpStylelint = require('gulp-stylelint');
/**
 * コンパイル処理
 */
exports.compileSass = () => src('./scss/*.scss')
                  .pipe(plumber(
                    { errorHandler: notify.onError('Error: <%= error.message %>') }
                  ))
                  .pipe(gulpStylelint({
                    reporters: [
                      {formatter: 'string', console: true}
                    ]
                  }))
                  // Sassのコンパイルを実行
                  // ※ gulp-sass v6 以降は新しい Dart Sass API を使用するため、
                  //   indentType / indentWidth オプションは無効です（タブ変換は後続の through2 で対応）。
                  .pipe(sass({
                    // 形式を指定して出力
                    outputStyle: 'expanded',
                  }))
                  // インデントをタブ文字に変換
                  // （gulp-sass v6 の新 API では indentType: 'tab' が無効なため through2 で対処）
                  .pipe(through.obj(function(file, enc, cb) {
                    if (file.isBuffer()) {
                      const content = file.contents.toString('utf8');
                      const converted = content.replace(/^( {2})+/gm, (match) => '\t'.repeat(match.length / 2));
                      file.contents = Buffer.from(converted, 'utf8');
                    }
                    cb(null, file);
                  }))
                  .pipe(autoprefixer([
                    'iOS >= 16.5',
                    'Android >= 7',
                    'last 1 Safari version',
                    'last 1 Chrome version',
                    'last 1 Edge version',
                    'not IE 11',
                    'not IE > 0',
                    'not Firefox > 0'
                  ])) // ベンダープレフィックスに関するバージョン設定
                  .pipe(csscomb())
                                    .pipe(linePlugins.lineEndingCorrector({ // 改行コード変換
                    verbose: false,
                    eolc: 'CRLF'
                  }))
                  // cssフォルダー以下に保存
                  .pipe(dest("./css"))
/**
 * cssを圧縮し、vm出力する処理
 */
exports.compVM = () => src('./css/*.css')
                .pipe(plumber(
                  {errorHandler: notify.onError('Error: <%= error.message %>')}
                ))
                .pipe(comp()) // 圧縮
                .pipe(vmRenameFile({ // vmにリネーム
                  extname: '.vm'
                }))
                // cssフォルダー以下に保存
                .pipe(dest("./vm"))
/**
 * Sassファイルを監視し、変更があったらSassを変換します
 */
// watchタスクを定義
exports.watch = () => watch("./scss/*.scss", series(exports.compileSass, exports.compVM));

// デフォルトタスクとしてwatchを設定
exports.default = exports.watch;
