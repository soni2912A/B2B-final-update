const express = require('express');
const router = express.Router();
const { getMyTickets, createTicket, getTicketById, addComment } = require('../../controllers/corporate/ticket.controller');
router.get('/', getMyTickets);
router.post('/', createTicket);
router.get('/:id', getTicketById);
router.post('/:id/comment', addComment);
module.exports = router;
