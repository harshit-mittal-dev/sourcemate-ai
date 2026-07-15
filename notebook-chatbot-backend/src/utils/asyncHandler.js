function asyncHandler(controllerFunction) {
  return function wrappedController(req, res, next) {
    Promise.resolve(controllerFunction(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;