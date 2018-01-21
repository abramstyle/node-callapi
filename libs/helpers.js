const helpers = {
  // apply async middlewares
  async applyMiddlewares(middlewares, data) {
    const middlewareTransformers = [...middlewares];
    async function applyMiddleware(resultGenerator) {
      const middleware = middlewareTransformers.shift();

      // console.log(middlewareTransformers.length, middleware, result);
      const result = await resultGenerator;

      if (typeof middleware === 'function') {
        return applyMiddleware(middleware.call(null, result));
      }

      if (middlewareTransformers.length === 0) {
        return result;
      }

      return result;
    }


    return applyMiddleware(Promise.resolve(data));
  },
};

module.exports = helpers;
