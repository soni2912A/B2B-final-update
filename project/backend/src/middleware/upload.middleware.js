const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.memoryStorage();

const LOGO_DIR = path.join(__dirname, '../../uploads/logos');
fs.mkdirSync(LOGO_DIR, { recursive: true });

const PROOF_DIR = path.join(__dirname, '../../uploads/proofs');
fs.mkdirSync(PROOF_DIR, { recursive: true });

const PRODUCT_IMG_DIR = path.join(__dirname, '../../uploads/products');
fs.mkdirSync(PRODUCT_IMG_DIR, { recursive: true });

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, LOGO_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const businessId = req.businessId ? String(req.businessId) : 'biz';
    cb(null, `${businessId}-${Date.now()}${ext}`);
  },
});

const LOGO_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const logoMimeFilter = (req, file, cb) => {
  if (LOGO_MIME.has(file.mimetype)) cb(null, true);
  else cb(new Error('Only PNG, JPEG, WEBP, or SVG images are allowed'), false);
};

const imageOnlyFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (/^(jpeg|jpg|png|webp)$/.test(ext)) cb(null, true);
  else cb(new Error('Only JPG, PNG, or WebP images are allowed'), false);
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (/^(jpeg|jpg|png|webp|csv|xlsx|xls)$/.test(ext)) cb(null, true);
  else cb(new Error('Only images and CSV/Excel files are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const productUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PRODUCT_IMG_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const businessId = req.businessId ? String(req.businessId) : 'biz';
      cb(null, `${businessId}-${Date.now()}${ext}`);
    },
  }),
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const docOnlyFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (/^(csv|xlsx|xls)$/.test(ext)) cb(null, true);
  else cb(new Error('Only CSV or Excel files are allowed for import'), false);
};

const uploadImport = multer({ storage, fileFilter: docOnlyFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const importFileMiddleware = (field = 'file') => (req, res, next) => {
  uploadImport.single(field)(req, res, (err) => {
    if (!err) return next();
    if (err && err.code === 'LIMIT_FILE_SIZE')
      return res.status(413).json({ success: false, message: 'File exceeds 5MB limit.' });
    if (err instanceof multer.MulterError)
      return res.status(400).json({ success: false, message: err.message });
    return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
  });
};

const uploadLogo = multer({ storage: logoStorage, fileFilter: logoMimeFilter, limits: { fileSize: 2 * 1024 * 1024 } });

const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PROOF_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const id = req.params.id ? String(req.params.id) : 'unknown';
    cb(null, `${id}-${Date.now()}${ext}`);
  },
});
const PROOF_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const proofMimeFilter = (req, file, cb) => {
  if (PROOF_MIME.has(file.mimetype)) cb(null, true);
  else cb(new Error('Only PNG, JPEG, or WEBP images are allowed for proof of delivery.'), false);
};
const uploadProof = multer({ storage: proofStorage, fileFilter: proofMimeFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const proofUploadMiddleware = (field = 'proof') => (req, res, next) => {
  uploadProof.single(field)(req, res, (err) => {
    if (!err) return next();
    if (err && err.code === 'LIMIT_FILE_SIZE')
      return res.status(413).json({ success: false, message: 'File exceeds 5MB limit.' });
    if (err instanceof multer.MulterError)
      return res.status(400).json({ success: false, message: err.message });
    return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
  });
};

const logoUploadMiddleware = (field = 'logo') => (req, res, next) => {
  uploadLogo.single(field)(req, res, (err) => {
    if (!err) return next();
    if (err && err.code === 'LIMIT_FILE_SIZE')
      return res.status(413).json({ success: false, message: 'File exceeds 2MB limit.' });
    if (err instanceof multer.MulterError)
      return res.status(400).json({ success: false, message: err.message });
    return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
  });
};

const productImageMiddleware = (req, res, next) => {
  productUpload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err && err.code === 'LIMIT_FILE_SIZE')
      return res.status(413).json({ success: false, message: 'Image exceeds 5MB limit.' });
    if (err instanceof multer.MulterError)
      return res.status(400).json({ success: false, message: err.message });
    return res.status(400).json({ success: false, message: err.message || 'Image upload failed.' });
  });
};

module.exports = {
  upload, uploadImport, importFileMiddleware,
  uploadLogo, logoUploadMiddleware, LOGO_DIR,
  uploadProof, proofUploadMiddleware, PROOF_DIR,
  productImageMiddleware, PRODUCT_IMG_DIR,
};
