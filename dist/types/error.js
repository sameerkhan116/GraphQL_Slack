"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// the error type which contains a path and message (corresponding to the sequelzie validation)

exports.default = `
  type Error {
    path: String!
    message: String
  }
`;