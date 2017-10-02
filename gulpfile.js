/**
 * Standard Gulpfile for Jason Fukura's build style
 *
 * For now, this is the new standard...
 * #TheTruthIsPublicDomain
 *
 * @type {*|Gulp}
 */

var gulp        = require( 'gulp' ),
    imagemin    = require( 'gulp-imagemin' ),
    cssmin      = require( 'gulp-cssmin' ),
    htmlmin     = require( 'gulp-htmlmin' ),
    // inline      = require( 'gulp-inline' ),
    // minline     = require( 'gulp-minify-inline' ),
    uglify      = require( 'gulp-uglify' ),
    browserSync = require( 'browser-sync' ),
    reload      = browserSync.reload,
    serve       = require( 'gulp-serve' ),
    psi         = require( 'psi' ),
    ngrok       = require( 'ngrok' ),
    concat      = require( 'gulp-concat' ),
    sass        = require( 'gulp-sass' ),
    sequence    = require( 'run-sequence' ),
    config      = null;

// Config object
config = {
    project : "Meet Scribbles",
    port    : 3000,
    build   : "dist",
    images  : {
        source : "img/*",
        target : "/img",
    },
    css     : {
        source : "css/*.css",
        target : "/css",
    },
    scss    : {
        source : "css/*.scss",
        target : "css/",
    },
    js      : {
        concat : [ 'js/lib/jquery-1.12.4.js', 'js/lib/app.js', ],
        name   : 'app.js',
        target : "js/",
    },
    fonts   : {
        source : "fonts/**/*",
        target : "/fonts",
    },
    view    : {
        source : "view/*.view.html",
        target : "/view",
    },
    content : {
        source : "view/*.xml",
        target : "/view",
    },
    html    : {
        source : "*.html",
        target : "/",
    },
};

/* ========================================================================== */
/* DEVELOPMENT TASKS                                                          */

// Compile SASS into an unminified CSS file
gulp.task( 'sass', function () {

    return gulp.src( config.scss.source )
        .pipe( sass().on( 'error', sass.logError ) )
        .pipe( gulp.dest( config.scss.target ) );

} );

// Concatenate scripts
gulp.task( 'concat-scripts', function () {

    return gulp.src( config.js.concat )
        .pipe( concat( config.js.name ) )
        .pipe( gulp.dest( config.js.target ) );

} );

// Watch Files For Changes & Reload
gulp.task( 'serve', function () {

    browserSync( {
        notify    : false,
        port      : config.port,
        logPrefix : config.project + ' :: Dev',
        // https: true, // Can run on https if needed
        server    : [ './', ],
    } );

    // HTML pages, views and content (XML) changes will require a reload
    gulp.watch( [ '*.html', ], reload );
    gulp.watch( [ 'views/*.html', ], reload );
    gulp.watch( [ 'content/*', ], reload );

    // SCSS changes require concatenation and reload
    gulp.watch( [ 'css/partials/*.scss', ], function () {

        sequence( 'sass', reload );

    } );

    // Script changes require concatenation and reload
    gulp.watch( [ 'js/lib/*.js', ], function () {

        sequence( 'concat-scripts', reload );

    } );

    // Watch for changes to the images folder
    gulp.watch( [ 'img/**/*', ], reload );

} );
/* ========================================================================== */

gulp.task( 'css', function () {

    return gulp.src( config.css.source )
    .pipe( cssmin() )
    .pipe( gulp.dest( config.build + config.css.target ) );

} );

gulp.task( 'html', function () {

    return gulp.src( config.html.source )
    .pipe( htmlmin( { collapseWhitespace : true, minifyJS : true, removeComments : true, } ) )
    .pipe( gulp.dest( config.build + config.html.target ) );

} );

gulp.task( 'view', function () {

    return gulp.src( config.view.source )
    .pipe( htmlmin( { collapseWhitespace : true, minifyJS : true, removeComments : true, } ) )
    .pipe( gulp.dest( config.build + config.view.target ) );

} );

gulp.task( 'project', function () {

    return gulp.src( config.project.source )
    .pipe( gulp.dest( config.build + config.project.target ) );

} );

gulp.task( 'img', function () {

    return gulp.src( config.img.source )
    .pipe( imagemin( {
        progressive : true,
    } ) )
    .pipe( gulp.dest( config.build + config.img.target ) );

} );

gulp.task( 'fonts', function () {

    return gulp.src( config.fonts.source )
    .pipe( gulp.dest( config.build + config.fonts.target ) );

} );

gulp.task( 'js', function () {

    return gulp.src( config.js.source )
    .pipe( uglify() )
    .pipe( gulp.dest( config.build + config.js.target ) );

} );

/* ========================================================================== */
/* BUILD TASKS                                                                */

gulp.task( 'ngrok-url', function ( cb ) {

    return ngrok.connect( portVal, function ( err, url ) {

        site = url;
        console.log( 'serving your tunnel from: ' + site );
        cb();

    } );

} );

gulp.task( 'psi-mobile', function () {

    return psi( site, {
        // key: key
        nokey    : 'true',
        strategy : 'mobile',
    } ).then( function ( data ) {

        console.log( site );
        console.log( data.pageStats );
        console.log( 'Speed score: ' + data.ruleGroups.SPEED.score );

    } );

} );

gulp.task( 'psi-desktop', function () {

    return psi( site, {
        nokey    : 'true',
        strategy : 'desktop',
    } ).then( function ( data ) {

        console.log( site );
        console.log( data.pageStats );
        console.log( 'Speed score: ' + data.ruleGroups.SPEED.score );

    } );

} );

// psi sequence with 'browser-sync-psi' instead
gulp.task( 'psi-seq', function ( cb ) {

    return sequence(
      // 'build',
      'serve',
      'ngrok-url',
      'psi-desktop',
      'psi-mobile',
      cb
    );

} );

// psi task runs and exits
gulp.task( 'psi', [ 'psi-seq', ], function () {

    process.exit();

} );

// Build the final html files
gulp.task( 'html', function () {

    return gulp.src( config.html.source )
        .pipe( htmlmin( {
            collapseWhitespace : true, // Collapse it
            removeComments     : true,     // No comments
            minifyJS           : true,            // Inlined JS will also minify
        } ) )
        .pipe( gulp.dest( config.build + config.html.target ) );

} );

// Build final images with optimization
// NOTE: [Image Build] -- Might need to address SVGs separately
gulp.task( 'img', function () {

    return gulp.src( config.images.source )
        .pipe( imagemin( {
            progressive : true,         // Run image minification
        } ) )
        .pipe( gulp.dest( config.build + config.images.target ) );

} );

// Build final CSS with minification
gulp.task( 'css', function () {

    return gulp.src( config.css.source )
        .pipe( cssmin() )
        .pipe( gulp.dest( config.build + config.css.target ) );

} );

// Build final JS files with minification
gulp.task( 'js', function () {

    pump( [
        gulp.src( config.js.target ),
        uglify(),
        gulp.dest( config.build + config.js.target ),
    ] );

} );

// Copy fonts to the DIST folder
gulp.task( 'fonts', function () {

    return gulp.src( config.fonts.source )
        .pipe( gulp.dest( config.build + config.fonts.target ) );

} );

// Build final content files (XML files that need minification)
gulp.task( 'content', function () {

    return gulp.src( config.content.source )
        .pipe( prettyData( {
            type             : 'minify',
            preserveComments : false,
        } ) )
        .pipe( gulp.dest( config.build + config.content.target ) );

} );

// Start test server
gulp.task( 'test', function () {

    browserSync( {
        notify    : false,
        port      : config.port,
        logPrefix : config.project + ' :: Build Test',
        // https: true,
        server    : [ 'dist/', ],
    } );

} );

// RUN gulp build to handle the build process and start the test server
gulp.task( 'build', function () {

    return sequence( 'html', 'css', 'js', 'img', 'content', 'fonts', 'test' );

} );
/* ========================================================================== */

