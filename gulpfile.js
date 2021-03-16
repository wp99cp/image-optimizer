const gulp = require('gulp');
const rename = require('gulp-rename');
const options = require('./options.json');
const clean = require('gulp-clean');
const convert = require('heic-convert');
const {promisify} = require('util');
const fs = require('fs');
const image = require('gulp-image');
const scaleImages = require('gulp-scale-images');
const flatMap = require('flat-map').default;
const del = require('del');

const INPUT_DIRECTORY = "./input";
const WORKING_DIRECTORY = "./processing";
const OUTPUT_DIRECTORY = "./output";

const WORKING_FILES = `${WORKING_DIRECTORY}/*.${generateImageTypeString()}`;
const INPUT_FILES = `${INPUT_DIRECTORY}/*.${generateImageTypeString()}`;


function generateImageTypeString() {

    let inputTypeSting = "{";
    const LENGTH = Object.keys(options.inputTypes).length;

    if (LENGTH == 0) throw new Error('No Input Type!');

    inputTypeSting += options.inputTypes[0] + "," + options.inputTypes[0].toUpperCase();

    for (let i = 1; i < LENGTH; i++)
        inputTypeSting += `,${options.inputTypes[i]},${options.inputTypes[i].toUpperCase()}`;

    return inputTypeSting + "}";
}

/**

 Starting point for the application.
 On start the output and working directory gets cleared.

 */
gulp.task('default', () => {

    // clear directories
    gulp.src(`${WORKING_DIRECTORY}/*`, {read: false}).pipe(clean());
    gulp.src(`${OUTPUT_DIRECTORY}/*`, {read: false}).pipe(clean());

    gulp.watch(INPUT_DIRECTORY + '/*.*', gulp.series('convert_heic', 'copy_files'));
    gulp.watch(WORKING_FILES, gulp.series('process'));

});

gulp.task('copy_files', (done) =>
    gulp.src(INPUT_FILES)
        .pipe(gulp.dest('./processing'))
        .on('end', function () {
            del(INPUT_DIRECTORY + '/*.*').then(function () {
                done();
            });
        })
);

function convert_files(path) {

    try {

        return new Promise(async res => {

            const inputBuffer = await promisify(fs.readFile)('./input/' + path);

            const outputBuffer = await convert({
                buffer: inputBuffer, // the HEIC file buffer
                format: 'JPEG',      // output format
                quality: 1           // the jpeg compression quality, between 0 and 1
            });

            await promisify(fs.writeFile)('./processing/' + path + '.jpg', outputBuffer);

            res();
        })
    } catch {
        return null;
    }

}


gulp.task("convert_heic", async () => {

    return Promise.all(
        fs.readdirSync('./input/')
            .filter(file => file.endsWith('.HEIC'))
            .map(file => convert_files(file)));

});


// duplicate the images
var processSizes = async (image, cb) => {

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


//compress all images
gulp.task('process', async function (done) {

    console.log('default');

    return gulp.src(WORKING_FILES)
        .pipe(flatMap(processSizes))
        .pipe(scaleImages())
        .pipe(image())
        //Remove Space
        .pipe(rename(function (opt) {
            opt.basename = opt.basename.split(' ').join('_');
            return opt;
        }))
        .pipe(gulp.dest(OUTPUT_DIRECTORY))
        .on('end', function () {
            del(WORKING_FILES).then(function () {
                done();
            });
        });

});





