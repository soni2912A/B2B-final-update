// const Ticket = require('../../models/Ticket.model');
// const TicketComment = require('../../models/TicketComment.model');
// const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
// const { getPagination } = require('../../utils/pagination');

// const STATUS_ENUM = ['open', 'in_progress', 'resolved', 'closed'];

// const handleError = (res, error, tag) => {
//   if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
//     return sendError(res, 400, error.message);
//   }
//   console.error(`[${tag}] unexpected error:`, error);
//   return sendError(res, 500, error.message);
// };

// const getAllTickets = async (req, res) => {
//   try {
//     const { page, limit, skip } = getPagination(req.query);
//     const filter = { business: req.businessId };
//     if (req.query.status) filter.status = req.query.status;
//     if (req.query.priority) filter.priority = req.query.priority;
//     if (req.query.corporate) filter.corporate = req.query.corporate;
//     const [tickets, total] = await Promise.all([
//       Ticket.find(filter)
//         .populate('corporate', 'companyName')
//         .populate('raisedBy', 'name email')
//         .populate('assignedTo', 'name')
//         .sort({ createdAt: -1 })
//         .skip(skip).limit(limit),
//       Ticket.countDocuments(filter),
//     ]);
//     return sendPaginated(res, tickets, total, page, limit, 'tickets');
//   } catch (e) { return handleError(res, e, 'getAllTickets'); }
// };

// const getTicketById = async (req, res) => {
//   try {
//     const ticket = await Ticket.findOne({ _id: req.params.id, business: req.businessId })
//       .populate('corporate', 'companyName')
//       .populate('raisedBy', 'name email')
//       .populate('assignedTo', 'name');
//     if (!ticket) return sendError(res, 404, 'Ticket not found');
//     const comments = await TicketComment.find({ ticket: ticket._id })
//       .populate('author', 'name role')
//       .sort({ createdAt: 1 });
//     return sendSuccess(res, 200, 'Ticket fetched', { ticket, comments });
//   } catch (e) { return handleError(res, e, 'getTicketById'); }
// };

// const updateTicketStatus = async (req, res) => {
//   try {
//     const { status, assignedTo } = req.body;
//     if (status && !STATUS_ENUM.includes(status)) {
//       return sendError(res, 400, `Status must be one of: ${STATUS_ENUM.join(', ')}.`);
//     }
//     const update = {};
//     if (status) update.status = status;
//     if (assignedTo) update.assignedTo = assignedTo;
//     if (status === 'resolved') update.resolvedAt = new Date();
//     const ticket = await Ticket.findOneAndUpdate(
//       { _id: req.params.id, business: req.businessId }, update, { new: true, runValidators: true }
//     );
//     if (!ticket) return sendError(res, 404, 'Ticket not found');
//     return sendSuccess(res, 200, 'Ticket updated', { ticket });
//   } catch (e) { return handleError(res, e, 'updateTicketStatus'); }
// };

// const replyToTicket = async (req, res) => {
//   try {
//     const { message, isInternal } = req.body;
//     if (!message || !message.trim()) return sendError(res, 400, 'Message is required');
//     const ticket = await Ticket.findOne({ _id: req.params.id, business: req.businessId });
//     if (!ticket) return sendError(res, 404, 'Ticket not found');
//     const comment = await TicketComment.create({
//       ticket: ticket._id,
//       author: req.user._id,
//       message: message.trim(),
//       isInternal: Boolean(isInternal),
//     });
//     await comment.populate('author', 'name role');
//     return sendSuccess(res, 201, 'Reply added', { comment });
//   } catch (e) { return handleError(res, e, 'replyToTicket'); }
// };

// module.exports = { getAllTickets, getTicketById, updateTicketStatus, replyToTicket };



const Ticket = require('../../models/Ticket.model');
const TicketComment = require('../../models/TicketComment.model');
const notificationService = require('../../services/notification.service');
const { sendSuccess, sendError, sendPaginated } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const STATUS_ENUM = ['open', 'in_progress', 'resolved', 'closed'];

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const getAllTickets = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { business: req.businessId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.corporate) filter.corporate = req.query.corporate;
    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('corporate', 'companyName')
        .populate('raisedBy', 'name email')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Ticket.countDocuments(filter),
    ]);
    return sendPaginated(res, tickets, total, page, limit, 'tickets');
  } catch (e) { return handleError(res, e, 'getAllTickets'); }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, business: req.businessId })
      .populate('corporate', 'companyName')
      .populate('raisedBy', 'name email')
      .populate('assignedTo', 'name');
    if (!ticket) return sendError(res, 404, 'Ticket not found');
    const comments = await TicketComment.find({ ticket: ticket._id })
      .populate('author', 'name role')
      .sort({ createdAt: 1 });
    return sendSuccess(res, 200, 'Ticket fetched', { ticket, comments });
  } catch (e) { return handleError(res, e, 'getTicketById'); }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    if (status && !STATUS_ENUM.includes(status)) {
      return sendError(res, 400, `Status must be one of: ${STATUS_ENUM.join(', ')}.`);
    }
    const update = {};
    if (status) update.status = status;
    if (assignedTo) update.assignedTo = assignedTo;
    if (status === 'resolved') update.resolvedAt = new Date();
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId }, update, { new: true, runValidators: true }
    );
    if (!ticket) return sendError(res, 404, 'Ticket not found');
    return sendSuccess(res, 200, 'Ticket updated', { ticket });
  } catch (e) { return handleError(res, e, 'updateTicketStatus'); }
};

const replyToTicket = async (req, res) => {
  try {
    const { message, isInternal } = req.body;
    if (!message || !message.trim()) return sendError(res, 400, 'Message is required');
    const ticket = await Ticket.findOne({ _id: req.params.id, business: req.businessId });
    if (!ticket) return sendError(res, 404, 'Ticket not found');
    const comment = await TicketComment.create({
      ticket: ticket._id,
      author: req.user._id,
      message: message.trim(),
      isInternal: Boolean(isInternal),
    });
    await comment.populate('author', 'name role');

    // Notify the corporate user who raised the ticket (unless this is internal note)
    if (!isInternal && ticket.raisedBy) {
      notificationService.createNotification({
        business: ticket.business,
        recipient: ticket.raisedBy,
        title: 'Support Ticket Reply',
        message: `Admin replied to ticket: ${ticket.subject}`,
        type: 'ticket',
        referenceId: ticket._id,
        referenceModel: 'Ticket',
      }).catch(err => console.error('[replyToTicket] notify failed:', err.message));
    }

    return sendSuccess(res, 201, 'Reply added', { comment });
  } catch (e) { return handleError(res, e, 'replyToTicket'); }
};

module.exports = { getAllTickets, getTicketById, updateTicketStatus, replyToTicket };