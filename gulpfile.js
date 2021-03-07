var gulp = require('gulp');
var rename = require('gulp-rename');

// user options such as image size
var options = require('./options.json');

function generateImageTypeString() {

    let inputTypeSting = "{";
    const LENGTH = Object.keys(options.inputTypes).length;

    if (LENGTH == 0) throw new Error('No Input Type!');

    inputTypeSting += options.inputTypes[0] + "," + options.inputTypes[0].toUpperCase();

    for (let i = 1; i < LENGTH; i++)
        inputTypeSting += `,${options.inputTypes[i]},${options.inputTypes[i].toUpperCase()}`;

    return inputTypeSting + "}";
}

const INPUT_DIRECTORY = "./input";
const INPUT_FILES = `${INPUT_DIRECTORY}/*.${generateImageTypeString()}`;
const OUTPUT_DIRECTORY = "./output";

// deleting all files of a directory
var clean = require('gulp-clean');

// Deletes all files in the folder /output
gulp.task('clearOutput', function () {
    return gulp.src(`${OUTPUT_DIRECTORY}/*`,
        { read: false })
        .pipe(clean());
});

// duplicate the images
var processSizes = (image, cb) => {

    let images = [];

    console.log(options.sizes)

    for (let sizeList of options.sizes)

        for (let size of options[sizeList]) {

            let imageClone = image.clone()
            imageClone.scale = {
                maxWidth: size,
                format: options.outputType
            }

            images.push(imageClone);

        }


    cb(null, images);
}

// Optimize Images and scaling
var image = require('gulp-image');
var scaleImages = require('gulp-scale-images');

// A flat map implementation for node streams
var flatMap = require('flat-map').default;

//compress all images
gulp.task('process', async function () {

    console.log('default');


    return gulp.src(INPUT_FILES)
        .pipe(flatMap(processSizes))
        .pipe(scaleImages())
        .pipe(image())
	//Remove Space
    	.pipe(rename(function(opt) {
      		opt.basename = opt.basename.split(' ').join('_');
      		return opt;
    	}))
        .pipe(gulp.dest(OUTPUT_DIRECTORY));

});

// Default Task watchs for file changes in the folder /input
gulp.task('default', function () {

    gulp.watch(INPUT_FILES, gulp.series('clearOutput', 'process'));

});
