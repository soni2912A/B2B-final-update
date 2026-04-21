const EmailTemplate = require('../../models/EmailTemplate.model');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

const handleError = (res, error, tag) => {
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return sendError(res, 400, error.message);
  }
  if (error && error.code === 11000) {
    return sendError(res, 400, 'A template with that name already exists.');
  }
  console.error(`[${tag}] unexpected error:`, error);
  return sendError(res, 500, error.message);
};

const getAllTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find({ business: req.businessId }).sort({ updatedAt: -1 });
    return sendSuccess(res, 200, 'Templates fetched', { templates });
  } catch (e) { return handleError(res, e, 'getAllTemplates'); }
};

const getTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({ _id: req.params.id, business: req.businessId });
    if (!template) return sendError(res, 404, 'Template not found');
    return sendSuccess(res, 200, 'Template fetched', { template });
  } catch (e) { return handleError(res, e, 'getTemplate'); }
};

const createTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.create({ ...req.body, business: req.businessId });
    return sendSuccess(res, 201, 'Template created', { template });
  } catch (e) { return handleError(res, e, 'createTemplate'); }
};

const updateTemplate = async (req, res) => {
  try {
    const { business, ...patch } = req.body;
    const template = await EmailTemplate.findOneAndUpdate(
      { _id: req.params.id, business: req.businessId },
      patch,
      { new: true, runValidators: true }
    );
    if (!template) return sendError(res, 404, 'Template not found');
    return sendSuccess(res, 200, 'Template updated', { template });
  } catch (e) { return handleError(res, e, 'updateTemplate'); }
};

const deleteTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOneAndDelete({ _id: req.params.id, business: req.businessId });
    if (!template) return sendError(res, 404, 'Template not found');
    return sendSuccess(res, 200, 'Template deleted');
  } catch (e) { return handleError(res, e, 'deleteTemplate'); }
};

module.exports = { getAllTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate };
