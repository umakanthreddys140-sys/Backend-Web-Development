/**
 * timing middleware  [mount GLOBALLY in app.js]
 *
 * TODO: export a middleware function (req, res, next) that logs how long the
 *       request took, in milliseconds.
 *   - record a start time at the top (Date.now())
 *   - on the response 'finish' event, log Date.now() - start
 *   - include req.id if it is set
 *   - call next() immediately so the request continues
 *
 * Example line:  [a3f9c1e2] POST /posts took 14ms
 */

module.exports = function timing(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const id = req.id ? `[${req.id.substring(0, 8)}] ` : '';
    const path = req.originalUrl || req.path;
    console.log(`${id}${req.method} ${path} took ${ms}ms`);
  });
  next();
};
