const Ticket = require('../../models/Ticket.model');
const TicketComment = require('../../models/TicketComment.model');
const notificationService = require('../../services/notification.service');
const { sendSuccess, sendError } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const CATEGORY_ENUM = ['delivery', 'order', 'billing', 'technical', 'general'];
const PRIORITY_ENUM = ['low', 'medium', 'high', 'urgent'];

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const getMyTickets = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { corporate: req.user.corporate, business: req.businessId };
    if (req.query.status) filter.status = req.query.status;
    const [tickets, total] = await Promise.all([
      Ticket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Ticket.countDocuments(filter),
    ]);
    return sendSuccess(res, 200, 'Tickets fetched', { tickets, total, page, limit });
  } catch (e) { return handleError(res, e, 'getMyTickets'); }
};

const createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority, relatedOrder } = req.body;
    if (!subject || !subject.trim()) return sendError(res, 400, 'Subject is required.');
    if (!description || !description.trim()) return sendError(res, 400, 'Description is required.');
    if (category && !CATEGORY_ENUM.includes(category)) {
      return sendError(res, 400, `Category must be one of: ${CATEGORY_ENUM.join(', ')}.`);
    }
    if (priority && !PRIORITY_ENUM.includes(priority)) {
      return sendError(res, 400, `Priority must be one of: ${PRIORITY_ENUM.join(', ')}.`);
    }

    const ticket = await Ticket.create({
      business: req.businessId,
      corporate: req.user.corporate,
      raisedBy: req.user._id,
      subject: subject.trim(),
      description: description.trim(),
      category: category || 'general',
      priority: priority || 'medium',
      relatedOrder: relatedOrder || undefined,
    });

    notificationService.notifyNewTicket(ticket, req.user._id)
      .catch(err => console.error('[createTicket] notifyNewTicket failed:', err.message));

    return sendSuccess(res, 201, 'Ticket created.', { ticket });
  } catch (e) { return handleError(res, e, 'createTicket'); }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      corporate: req.user.corporate,
      business: req.businessId,
    });
    if (!ticket) return sendError(res, 404, 'Ticket not found');
    const comments = await TicketComment.find({ ticket: ticket._id, isInternal: false })
      .populate('author', 'name').sort({ createdAt: 1 });
    return sendSuccess(res, 200, 'Ticket fetched', { ticket, comments });
  } catch (e) { return handleError(res, e, 'getTicketById'); }
};

const addComment = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return sendError(res, 400, 'Message is required');
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      corporate: req.user.corporate,
      business: req.businessId,
    });
    if (!ticket) return sendError(res, 404, 'Ticket not found');
    if (ticket.status === 'closed') return sendError(res, 400, 'Cannot comment on a closed ticket');
    const comment = await TicketComment.create({
      ticket: ticket._id,
      author: req.user._id,
      message: message.trim(),
      isInternal: false,
    });
    await comment.populate('author', 'name');
    return sendSuccess(res, 201, 'Comment added', { comment });
  } catch (e) { return handleError(res, e, 'addComment'); }
};

module.exports = { getMyTickets, createTicket, getTicketById, addComment };
