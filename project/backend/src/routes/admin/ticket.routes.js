const express = require('express');
const router = express.Router();
const { getAllTickets, getTicketById, updateTicketStatus, replyToTicket } = require('../../controllers/admin/ticket.controller');
router.get('/', getAllTickets);
router.get('/:id', getTicketById);
router.patch('/:id/status', updateTicketStatus);
router.post('/:id/reply', replyToTicket);
module.exports = router;
