module.exports = {
  v7: () => require('crypto').randomUUID(),
  v4: () => require('crypto').randomUUID()
};
