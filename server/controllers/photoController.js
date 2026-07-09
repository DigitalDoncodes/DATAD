const Photo = require('../models/Photo');
const Album = require('../models/Album');
const cloudinary = require('../config/cloudinary');

exports.uploadPhoto = async (req, res, next) => {
  try {
    const { albumId, caption } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });
    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ message: 'Album not found' });

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'd-square-labs/photos',
    });

    const photo = await Photo.create({
      album: albumId,
      url: result.secure_url,
      publicId: result.public_id,
      caption,
      uploadedBy: req.user.userId,
    });
    res.status(201).json(photo);
  } catch (err) {
    next(err);
  }
};

exports.deletePhoto = async (req, res, next) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    if (!photo.uploadedBy.equals(req.user.userId)) {
      return res.status(403).json({ message: 'Only the uploader can delete this photo' });
    }
    await cloudinary.uploader.destroy(photo.publicId);
    await photo.deleteOne();
    res.json({ message: 'Photo deleted' });
  } catch (err) {
    next(err);
  }
};

exports.listRecentPhotos = async (req, res, next) => {
  try {
    const photos = await Photo.find()
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(8);
    res.json(photos);
  } catch (err) {
    next(err);
  }
};
