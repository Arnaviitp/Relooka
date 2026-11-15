const express = require('express');
const multer = require('multer');
const router = express.Router();
const listingController = require('./listing.controller');
const { authenticate, optionalAuthenticate } = require('../../core/middleware/auth.middleware');
const { requireRole, requireCapability } = require('../../core/middleware/roleGuard.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB max overall
  }
});

const mediaUploadMiddleware = upload.fields([
  { name: 'photos', maxCount: 6 },
  { name: 'video', maxCount: 1 }
]);

// Public browsing
router.get('/', optionalAuthenticate, listingController.getListings);
router.get('/:id', optionalAuthenticate, listingController.getListingById);

// Defect inspection for garments (AI Computer Vision)
router.post('/inspect-defect', optionalAuthenticate, upload.single('photo'), listingController.inspectGarmentPhoto);

// Lender actions
router.post('/', authenticate, requireCapability('lender'), listingController.createListing);
router.post('/upload', authenticate, requireCapability('lender'), mediaUploadMiddleware, listingController.uploadMedia);
router.get('/me/listings', authenticate, requireCapability('lender'), listingController.getMyListings);

// Admin / Hub Staff verification & QC actions
router.patch('/:id/verify', authenticate, requireRole('admin'), listingController.verifyListing);
router.patch('/:id/qc/:qcType', authenticate, requireRole('admin', 'hub_staff'), listingController.recordQC);

module.exports = router;

