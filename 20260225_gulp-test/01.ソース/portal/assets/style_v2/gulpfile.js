// gulpプラグインの読み込み
const { src, dest, watch, series } = require("gulp");
// Sassをコンパイルするプラグインの読み込み
const sass = require("gulp-sass");
// dart-sassに変更
sass.compiler = require('sass');
// ベンダープレフィックス自動付与
const autoprefixer = require('gulp-autoprefixer');
// css圧縮プラグイン
const comp = require('gulp-clean-css');
const vmRenameFile = require("gulp-rename");
// 改行コード変換プラグイン
const gulpLoadPlugins = require ('gulp-load-plugins');   
const linePlugins = gulpLoadPlugins(); 
// コンパイル速度向上
const fibers = require('fibers');
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
const compileSass = () => src('./scss/*.scss')
                  .pipe(plumber(
                    { errorHandler: notify.onError('Error: <%= error.message %>') }
                  ))

                  .pipe(gulpStylelint({
                    reporters: [
                      {formatter: 'string', console: true}
                    ]
                  }))
                  // Sassのコンパイルを実行
                  .pipe(sass
                    ({ // 形式を指定して出力
                      outputStyle:'expanded',
                      indentType: 'tab',
                      indentWidth: 1,
                      fibers: fibers,
                    })
                  )
                  .pipe(autoprefixer([
                    'last 2 versions', 
                    'Android >= 4.4',
                    'not IE > 0',                 // ieサポート終了における除外対応
                    'not ie_mob > 0',             // ieサポート終了における除外対応
                    'not dead'                    // サポートされているブラウザのみ
                    
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
const compVM = () => src('./css/*.css')
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
const watchSassFiles = () => watch("./scss/*.scss", series(compileSass, compVM));
 // npx gulpコマンドを実行した時、watchSassFilesが実行される
exports.default = watchSassFiles;
