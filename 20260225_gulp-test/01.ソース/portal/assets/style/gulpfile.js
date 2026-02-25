// gulpプラグインの読み込み
const { src, dest, watch, series } = require("gulp");
// Sassをコンパイルするプラグインの読み込み
const sass = require("gulp-sass")(require('sass'));
// ベンダープレフィックス自動付与
const autoprefixer = require('gulp-autoprefixer');
// css圧縮プラグイン
const comp = require('gulp-clean-css');
const vmRenameFile = require("gulp-rename");
// 改行コード変換プラグイン
const gulpLoadPlugins = require ('gulp-load-plugins');   
const linePlugins = gulpLoadPlugins(); 
// コンパイルエラー検知 強制終了防止
const plumber = require('gulp-plumber');
// デスクトップ通知
const notify = require('gulp-notify');
// css整形
var csscomb = require("gulp-csscomb");
const gulpStylelint = require('gulp-stylelint');
// 文字コード変換（Node.js 16対応）
const iconv = require('iconv-lite');
const through = require('through2');
const vinylBuffer = require('vinyl-buffer');

/**
 * 文字コード変換関数
 */
const convertToEncoding = (encoding, addBOM = false) => {
  return through.obj((file, enc, cb) => {
    if (file.isNull()) {
      return cb(null, file);
    }
    
    if (file.isStream()) {
      return cb(new Error('Streaming not supported'));
    }
    
    if (file.isBuffer()) {
      let content = file.contents.toString();
      
      // BOM付きUTF-8の場合
      if (encoding === 'utf8' && addBOM) {
        content = '\ufeff' + content;
        file.contents = Buffer.from(content, 'utf8');
      } else {
        // その他のエンコーディング
        file.contents = iconv.encode(content, encoding);
      }
    }
    
    cb(null, file);
  });
};
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
                      style:'expanded'
                    }).on('error', sass.logError)
                  )
                  .pipe(autoprefixer([
                    'iOS >= 16.5',                // iOS 16.5以上
                    'Android >= 7',               // Android 7以上
                    'last 2 Chrome versions',     // Chrome 最新2バージョン
                    'last 2 Edge versions',       // Edge 最新2バージョン
                    'last 2 Safari versions',     // Safari 最新2バージョン
                    'not IE > 0',                 // ieサポート終了における除外対応
                    'not ie_mob > 0',             // ieサポート終了における除外対応
                    'not dead'                    // サポートされているブラウザのみ
                    
                  ])) // ベンダープレフィックスに関するバージョン設定
                  .pipe(csscomb())
                  .pipe(convertToEncoding('utf8'))  // UTF-8（BOMなし）に変換
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
 * CSS文字コード別出力処理
 */
// UTF-8 BOM付き
const compileUTF8BOM = () => src('./css/*.css')
                .pipe(plumber(
                  {errorHandler: notify.onError('Error: <%= error.message %>')}
                ))
                .pipe(convertToEncoding('utf8', true))  // UTF-8 BOM付き
                .pipe(vmRenameFile({ 
                  suffix: '-utf8bom'
                }))
                .pipe(dest("./css"))

// Shift_JIS
const compileShiftJIS = () => src('./css/*.css')
                .pipe(plumber(
                  {errorHandler: notify.onError('Error: <%= error.message %>')}
                ))
                .pipe(convertToEncoding('shift_jis'))   // Shift_JIS
                .pipe(vmRenameFile({ 
                  suffix: '-sjis'
                }))
                .pipe(dest("./css"))
/**
 * Sassファイルを監視し、変更があったらSassを変換します
 */
const watchSassFiles = () => watch("./scss/*.scss", series(compileSass, compVM));
 // npx gulpコマンドを実行した時、watchSassFilesが実行される
exports.default = watchSassFiles;
exports.compileSass = compileSass;
exports.compVM = compVM;
exports.compileUTF8BOM = compileUTF8BOM;
exports.compileShiftJIS = compileShiftJIS;
exports.build = series(compileSass, compVM);
exports.buildAll = series(compileSass, compVM, compileUTF8BOM, compileShiftJIS);
