const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

// Lazy-load the model so require() never fails if Announcement.model.js
// hasn't been registered yet (safe on first boot)
function getModel() {
  if (mongoose.models.Announcement) return mongoose.models.Announcement;
  const schema = new mongoose.Schema({
    title:    { type: String, required: true, trim: true },
    message:  { type: String, required: true, trim: true },
    audience: { type: String, enum: ['all', 'admin', 'corporate', 'staff'], default: 'all' },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', default: null },
    createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    readBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  }, { timestamps: true });
  return mongoose.model('Announcement', schema);
}

// GET /super-admin/announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const Announcement = getModel();
    const list = await Announcement.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    return sendSuccess(res, 200, 'OK', { announcements: list });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /super-admin/announcements
exports.createAnnouncement = async (req, res) => {
  try {
    const Announcement = getModel();
    const { title, message, audience } = req.body;
    if (!title || !message) return sendError(res, 400, 'Title and message are required.');
    const validAudiences = ['all', 'admin', 'corporate', 'staff'];
    if (audience && !validAudiences.includes(audience)) {
      return sendError(res, 400, 'Invalid audience value.');
    }
    const ann = await Announcement.create({
      title:    title.trim(),
      message:  message.trim(),
      audience: audience || 'all',
      createdBy: req.user._id,
    });
    return sendSuccess(res, 201, 'Announcement created.', { announcement: ann });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// PATCH /super-admin/announcements/:id
exports.updateAnnouncement = async (req, res) => {
  try {
    const Announcement = getModel();
    const { title, message, audience } = req.body;
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return sendError(res, 404, 'Announcement not found.');
    if (title)    ann.title    = title.trim();
    if (message)  ann.message  = message.trim();
    if (audience) ann.audience = audience;
    await ann.save();
    return sendSuccess(res, 200, 'Announcement updated.', { announcement: ann });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /super-admin/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
  try {
    const Announcement = getModel();
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return sendError(res, 404, 'Announcement not found.');
    ann.isActive = false;
    await ann.save();
    return sendSuccess(res, 200, 'Announcement deleted.');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /announcements/me — all roles read their own announcements
exports.getMyAnnouncements = async (req, res) => {
  try {
    const Announcement = getModel();
    const roleMap = {
      admin:          ['all', 'admin'],
      staff:          ['all', 'staff'],
      corporate_user: ['all', 'corporate'],
      super_admin:    ['all', 'admin', 'corporate', 'staff'],
    };
    const allowed = roleMap[req.user.role] || ['all'];
    const list = await Announcement.find({ isActive: true, audience: { $in: allowed } })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('title message audience createdAt readBy');

    const userId = req.user._id.toString();
    const enriched = list.map(a => ({
      _id:       a._id,
      title:     a.title,
      message:   a.message,
      audience:  a.audience,
      createdAt: a.createdAt,
      isRead:    a.readBy.map(id => id.toString()).includes(userId),
    }));
    return sendSuccess(res, 200, 'OK', { announcements: enriched });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// PATCH /announcements/:id/read
exports.markRead = async (req, res) => {
  try {
    const Announcement = getModel();
    await Announcement.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id },
    });
    return sendSuccess(res, 200, 'Marked as read.');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};