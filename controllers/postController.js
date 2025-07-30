const Post = require('../models/post');
const path = require('path');

// Helper to parse tags from input string or array, normalize to lowercase, unique
const parseTags = (tagsInput) => {
  if (!tagsInput) return [];
  let tagsArray = [];
  if (Array.isArray(tagsInput)) {
    tagsArray = tagsInput;
  } else if (typeof tagsInput === 'string') {
    tagsArray = tagsInput
      .split(/[\s,#]+/)
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);
  }

  // ✅ Ensure each tag starts with #
  tagsArray = tagsArray.map(tag => tag.startsWith('#') ? tag : `#${tag}`);

  return [...new Set(tagsArray)];
};


// Upload combined text + audio post with tags
exports.uploadPost = async (req, res) => {
  try {
    const { text, mood, region, hashtag } = req.body;

    if (!mood?.trim()) return res.status(400).json({ error: 'Mood is required.' });
    if (!region?.trim()) return res.status(400).json({ error: 'Region is required.' });
    if (!text?.trim()) return res.status(400).json({ error: 'Text content is required.' });
    if (!req.file?.filename) return res.status(400).json({ error: 'Audio recording is required.' });

    const parsedTags = parseTags(hashtag);
    const audioUrl = `/uploads/${req.file.filename}`;

    const newPost = new Post({
      type: 'both',
      content: text.trim(),
      audioUrl,
      mood: mood.trim(),
      region: region.trim(),
      tags: parsedTags,
      views: 0,
      reactions: {
        relatable: 0,
        shocking: 0,
        funny: 0,
        sad: 0,
      },
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Upload post error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Upload text post with tags (optional)
exports.uploadText = async (req, res) => {
  try {
    const { content, mood, region, tags } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Text content is required.' });

    const parsedTags = parseTags(tags);

    const post = new Post({
      type: 'text',
      content: content.trim(),
      mood: mood?.trim() || '',
      region: region?.trim() || '',
      tags: parsedTags,
      views: 0,
      reactions: {
        relatable: 0,
        shocking: 0,
        funny: 0,
        sad: 0,
      },
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload audio post with tags (optional)
exports.uploadAudio = async (req, res) => {
  try {
    const { mood, region, tags, content } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const parsedTags = parseTags(tags);

    const newPost = new Post({
      type: 'audio',
      audioUrl: `/uploads/${req.file.filename}`,
      content: content?.trim() || '',
      mood: mood?.trim() || '',
      region: region?.trim() || '',
      tags: parsedTags,
      views: 0,
      reactions: {
        relatable: 0,
        shocking: 0,
        funny: 0,
        sad: 0,
      },
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error saving audio post:', error);
    res.status(500).json({ error: 'Failed to save audio post' });
  }
};

// Get paginated, filtered, searchable feed with tag filter
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { mood, region, type, search, tag } = req.query;

    const filter = {};
    if (mood) filter.mood = mood;
    if (region) filter.region = region;
    if (type) filter.type = type;
    if (search) filter.content = { $regex: search, $options: 'i' };
     if (tag) filter.tags = { $in: [tag] };


    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    posts.forEach(post => {
      post.reactions ||= { relatable: 0, shocking: 0, funny: 0, sad: 0 };
      post.views ||= 0;
      if (post.audioUrl && !post.audioUrl.startsWith('http')) {
        post.audioUrl = `/uploads/${post.audioUrl.split('/').pop()}`;
      }
    });

    res.json({ posts, page, totalPages, totalPosts });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: error.message });
  }
};

// React to a post
exports.reactToPost = async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  const allowedReactions = ['relatable', 'shocking', 'funny', 'sad'];
  if (!allowedReactions.includes(type)) return res.status(400).json({ error: 'Invalid reaction type' });

  try {
    await Post.findByIdAndUpdate(id, { $inc: { [`reactions.${type}`]: 1 } });
    res.json({ message: 'Reaction recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Increment view count on a post
exports.addView = async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch leaderboard based on most views
exports.getLeaderboard = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ views: -1 })
      .limit(10)
      .lean();

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



