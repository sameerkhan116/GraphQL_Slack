import formidable from 'formidable';

const uploadDir = 'files';

/* eslint-disable-next-line consistent-return  */
export default (req, res, next) => {
  if (!req.is('multipart/form-data')) return next();

  const form = formidable.IncomingForm({ uploadDir });

  // Parse the multipart form request
  form.parse(req, (error, { operations }, files) => {
    if (error) console.log(error);
    const document = JSON.parse(operations);
    // Check if files were uploaded
    if (Object.keys(files).length) {
      const { file: { type, path } } = files;
      document.variables.file = {
        type,
        path,
      };
    }
    req.body = document;
    next();
  });
};
