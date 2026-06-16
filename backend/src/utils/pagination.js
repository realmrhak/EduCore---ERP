const getPagination = (page, size) => {
  const limit = size ? +size : 20;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit, count) => {
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(count / limit);
  return { total: count, data, totalPages, currentPage };
};

module.exports = { getPagination, getPagingData };
