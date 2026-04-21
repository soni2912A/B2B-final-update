const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, parseInt(query.limit) || 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildSortQuery = (query) => {
  if (!query.sortBy) return { createdAt: -1 };
  const order = query.order === 'asc' ? 1 : -1;
  return { [query.sortBy]: order };
};

const buildSearchQuery = (query, fields) => {
  if (!query.search) return {};
  const regex = new RegExp(query.search, 'i');
  return { $or: fields.map(field => ({ [field]: regex })) };
};

module.exports = { getPagination, buildSortQuery, buildSearchQuery };
