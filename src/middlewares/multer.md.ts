import multer from 'multer';
import path from 'path';
import fs from 'fs';


// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Set storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the upload directory
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    // Set the filename for the uploaded file
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Create the multer upload instance
const upload = multer({ storage });

// Export the upload middleware for use in your routes
export { upload };

