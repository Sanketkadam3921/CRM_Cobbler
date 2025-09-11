import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';   // optional, for unique names

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'public/bills'),
  filename: (_req, file, cb) =>
    cb(null, `${uuid()}${path.extname(file.originalname)}`)
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) =>
  /jpeg|jpg|png|pdf/i.test(path.extname(file.originalname))
    ? cb(null, true)
    : cb(new Error('Only JPG, PNG, PDF allowed'));

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });