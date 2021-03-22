_Version 2.0.0_

# Basic Commandline Image Optimizer

This is a simple command-line based image optimizer running on Node.js. It monitors file changes in the input (```./input/```) directory, converts them to the selected sizes and file types, and put them in an output (```./output```) directory.

## Use-Case
This tool is optimal to create file-size optimized images for web applications. In one run, it can create form a single image all the necessary output formats and sizes.

## Start Optimizer
1) To start the optimizer, install all the dependencies with
```npm install```

2) Then start the script with 
```gulp default```
