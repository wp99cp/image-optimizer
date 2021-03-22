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
const tap = require('gulp-tap');
const inquirer = require("inquirer");

const INPUT_DIRECTORY = "./input";
const WORKING_DIRECTORY = "./processing";
const OUTPUT_DIRECTORY = "./output";


/**
 *
 * Generates a set of file-names according to the settings.
 * Containing all natively supported file types listed in the settings,
 * i.g., JPG, PNG, JPEG, and GIF.
 *
 * @return {string}
 */
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
 * List of natively supported file types listed in the settings.
 * In the WORKING_DIRECTORY (./processing/).
 * @type {string}
 */
const WORKING_FILES = `${WORKING_DIRECTORY}/*.${generateImageTypeString()}`;

/**
 * List of natively supported file types listed in the settings.
 * In the INPUT_DIRECTORY (./input/).
 * @type {string}
 */
const INPUT_FILES = `${INPUT_DIRECTORY}/*.${generateImageTypeString()}`;

let sizes = [];

/**

 Starting point for the application.
 On start the output and working directory gets cleared.

 */
gulp.task('default', async () => {

    console.log(`\n\n
                 *********************************************************
                 *              Welcome to the image optimizer           *
                 *            created by Cyrill Püntener v/o JPG         *
                 *                                                       *
                 *                    (c) 2019 - 2021                    *
                 *********************************************************\n\n`)

    console.log('** setup application **')


    // clear directories
    console.info('✔  Clear INPUT_DIRECTORY, WORKING_DIRECTORY, and OUTPUT_DIRECTORY.')
    gulp.src(`${INPUT_DIRECTORY}/*`, {read: false}).pipe(clean());
    gulp.src(`${WORKING_DIRECTORY}/*`, {read: false}).pipe(clean());
    gulp.src(`${OUTPUT_DIRECTORY}/*`, {read: false}).pipe(clean());

    // ready for processing files
    console.info('✔  Ready for processing images.');
    gulp.watch(INPUT_DIRECTORY + '/*.*', gulp.series('convert_heic', 'copy_files', 'process'));

    console.log('\n \n');

    const answers = await inquirer.prompt([
        {
            type: 'checkbox',
            message: 'Select output formats',
            name: 'output_format',
            choices: options.output_formates,
            validate: function (answer) {
                if (answer.length < 1) {
                    return 'You must choose at least one output.';
                }

                return true;
            },
        },
    ])


    sizes = options.output_formates
        .filter(out => answers['output_format'].includes(out.name))
        .map(out => out.sizes).flat();

    console.log('Selected formats: ', answers['output_format'])
    console.log('Generated sizes: ', sizes);

});


/**
 *
 * Converts images in the apple's HEIC format to JPEG images for
 * further processing.
 *
 */
gulp.task("convert_heic", async () => {

    console.log('\n** Convert files from HEIC to JPEG**')

    return Promise.all(fs.readdirSync('./input/')
        .filter(path => path.endsWith('.HEIC'))
        .map(path => new Promise(async res => {

                const inputBuffer = await promisify(fs.readFile)('./input/' + path);

                const outputBuffer = await convert({
                    buffer: inputBuffer, // the HEIC file buffer
                    format: 'JPEG',      // output format
                    quality: 1           // the jpeg compression quality, between 0 and 1
                });

                await promisify(fs.writeFile)('./processing/' + path + '.jpg', outputBuffer);

                console.log('✔ ' + path + ' converted to JPG')

                try {
                    fs.unlinkSync('./input/' + path)
                    //file removed
                } catch (err) {
                    console.error(err)
                }

                res();
            })
        ));
});


/**
 * Copies the files into the WORKING_DIRECTORY.
 *
 */
gulp.task('copy_files', () =>
    gulp.src(INPUT_FILES)
        .pipe(tap((file) => fs.unlinkSync(file.path)))
        .pipe(gulp.dest('./processing')));


/**

 Compress the images according to the settings.
 Creates the different output formates.

 */
gulp.task('process', async function () {

    console.log('\n** Convert files **')

    return gulp.src(WORKING_FILES)
        .pipe(tap((file) => {
            try {
                fs.unlinkSync(file.path)
            } catch {
            }
        }))
        .pipe(flatMap(processSizes))
        .pipe(scaleImages())
        .pipe(image())
        //Remove Space
        .pipe(rename(function (opt) {
            opt.basename = opt.basename.split(' ').join('_');
            return opt;
        }))
        .pipe(gulp.dest(OUTPUT_DIRECTORY))


});


/**
 * Helper function for scaling the images.
 * Clones the original file steam and scales the
 * image to the listed sizes.
 *
 * @param image
 * @param cb
 * @return {Promise<void>}
 */
const processSizes = async (image, cb) => {

    let images = [];

    for (let size of sizes) {

        let imageClone = image.clone()

        imageClone.scale = {
            maxWidth: size,
            format: options.outputType
        }

        images.push(imageClone);

    }

    cb(null, images);
}






