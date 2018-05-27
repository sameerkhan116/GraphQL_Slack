// the fileMiddleware for setting up setup of uploading files rather than regular text messages
// in the messages component. This middleware is passed where we craete the graphql endpoint in
// index.js
import formidable from 'formidable'; // for parsing fileUploads

const uploadDir = 'files'; // pointing to the files folder in the root of the directory.

/* eslint-disable-next-line consistent-return  */
export default (req, res, next) => {
  // if the req doesn't contain multipart form data (files), just pass to next middleware.
  if (!req.is('multipart/form-data')) return next();

  // create a new incoming form where the uploadDir is the files folder we are pointing to.
  const form = formidable.IncomingForm({ uploadDir });

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
        path,
      };
    }
    // attach the document in the req.body.
    req.body = document;
    next();
  });
};
