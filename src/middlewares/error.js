function notFound(req, res, next) {
  res.status(404).json({ ok: false, message: "Route not found" });
}

function errorHandler(err, req, res, next) {
  console.error("ERROR!!", err);
  const status = err.status || 500;
  res
    .status(status)
    .json({ ok: false, message: err.message || "Server error" });
}

module.exports = { notFound, errorHandler };
