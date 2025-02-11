import * as express from 'express';

namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }