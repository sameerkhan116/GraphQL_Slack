'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _formidable = require('formidable');

var _formidable2 = _interopRequireDefault(_formidable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// for parsing fileUploads

const uploadDir = 'files'; // pointing to the files folder in the root of the directory.

/* eslint-disable-next-line consistent-return  */
// the fileMiddleware for setting up setup of uploading files rather than regular text messages
// in the messages component. This middleware is passed where we craete the graphql endpoint in
// index.js

exports.default = (req, res, next) => {
  // if the req doesn't contain multipart form data (files), just pass to next middleware.
  if (!req.is('multipart/form-data')) return next();

  // create a new incoming form where the uploadDir is the files folder we are pointing to.
  const form = _formidable2.default.IncomingForm({ uploadDir });

  // Parse the multipart form request
  form.parse(req, (error, { operations }, files) => {
    if (error) console.log(error); // log the errors.
    const document = JSON.parse(operations); // get the document from the parsing the operation.
    // Check if files were uploaded
    if (Object.keys(files).length) {
      const { file: { type, path } } = files; // get the type and path from the files uploaded.
      // pass the type and path to the document.
      document.variables.file = {
        type,
        path
      };
    }
    // attach the document in the req.body.
    req.body = document;
    next();
  });
};