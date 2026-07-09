const Album = require('../models/Album');

const isHttpUrl = (value) => /^https?:\/\/.+/i.test(value || '');

exports.listAlbums = async (req, res, next) => {
  try {
    const albums = await Album.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(albums);
  } catch (err) {
    next(err);
  }
};

exports.createAlbum = async (req, res, next) => {
  try {
    const { title, description, link, cover } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!isHttpUrl(link)) {
      return res.status(400).json({ message: 'A valid album link (starting with http) is required' });
    }
    if (cover && !isHttpUrl(cover)) {
      return res.status(400).json({ message: 'The cover must be a valid image URL' });
    }
    const album = await Album.create({
      title,
      description,
      link,
      cover,
      createdBy: req.user.userId,
    });
    res.status(201).json(album);
  } catch (err) {
    next(err);
  }
};

exports.deleteAlbum = async (req, res, next) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    if (!album.createdBy.equals(req.user.userId)) {
      return res.status(403).json({ message: 'Only the creator can delete this album' });
    }
    await album.deleteOne();
    res.json({ message: 'Album deleted' });
  } catch (err) {
    next(err);
  }
};
