const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  uploadPost,    // combined handler for text + audio + tags
  getFeed,       // supports filtering by mood, region, type, tag, and search
  addView,
  getLeaderboard,
  reactToPost
} = require('../controllers/postController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Allow only audio mimetypes
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Upload route supports text + audio + tags in req.body and req.file
router.post('/upload', upload.single('audio'), uploadPost);

// Feed supports query params for pagination and filters including tag
router.get('/feed', getFeed);

// Other routes
router.post('/view/:id', addView);
router.get('/leaderboard', getLeaderboard);
router.post('/react/:id', reactToPost);

module.exports = router;





