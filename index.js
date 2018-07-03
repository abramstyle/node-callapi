const fetch = require('node-fetch');
const FormData = require('form-data');
const { objectUtils, stringUtils, urlUtils } = require('@abramstyle/utils');

const { applyMiddlewares } = require('./libs/helpers');
const {
  resultTransformer, responseParser, resultFilter,
} = require('./libs/defaultMiddlewares');

const methods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE', 'HEAD', 'CONNECT']);
const postMethods = new Set(['POST', 'PUT', 'PATCH']);
// const supportedTypes = new Set('json', 'text');

class APICall {
  constructor(options = { middlewares: [] }) {
    const {
      // middlewares will be apply when instantiation
      middlewares,
      // if logPath is passed, a logfile will be created
      logPath,
    } = options;

    this.settings = {
      middlewares: [
        responseParser,
        resultTransformer,
        ...middlewares,
      ],
      logPath,
    };
  }

  async call(url, options = {}) {
    if (!stringUtils.isString(url)) {
      throw TypeError('expect url as a string');
    }

    const endpoint = this.serializeUrl(url, options);
    const fetchOptions = this.serializeOptions(options);

    const fetchData = {
      fetchOptions,
      url: endpoint,
      response: null,
      duration: 0,
      error: null,
      data: null,
    };

    const startTime = Date.now();
    try {
      const response = await fetch(endpoint, fetchOptions);
      const endTime = Date.now();

      Object.assign(fetchData, {
        duration: endTime - startTime,
        response,
      });
    } catch (e) {
      const endTime = Date.now();

      Object.assign(fetchData, {
        duration: endTime - startTime,
        error: e,
      });
    }

    const { middlewares } = fetchOptions;
    const result = await applyMiddlewares(middlewares, fetchData);
    return result;
  }

  serializeUrl(url, options) {
    return urlUtils.mergeQuerystring(url, options.query);
  }

  serializeOptions(options = {}) {
    const fetchOptions = {
      credentials: 'same-origin',
      middlewares: [...this.settings.middlewares],
      method: 'GET',
      timeout: 0,
      headers: {
        Accept: 'application/json',
      },
      query: {},
      body: null,
    };

    // apply all fetch data to fetch options
    if (options.data) {
      Object.assign(fetchOptions, {
        body: options.data,
      });
    }

    if (options.query) {
      Object.assign(fetchOptions, {
        query: options.query,
      });
    }

    if (postMethods.has(options.method)) {
      if (fetchOptions.body instanceof FormData) {
        Object.assign(fetchOptions, {
          headers: Object.assign(fetchOptions.headers, {
          // json is first priority if server is support
            'Content-Type': 'multipart/form-data',
          }),
        });
      } else if (objectUtils.isObject(fetchOptions.body) || Array.isArray(fetchOptions.body)) {
        Object.assign(fetchOptions, {
          headers: Object.assign(fetchOptions.headers, {
          // json is first priority if server is support
            'Content-Type': 'application/json',
          }),
        });
        fetchOptions.body = JSON.stringify(fetchOptions.body);
      }
    } else if (objectUtils.isObject(fetchOptions.body) && !(fetchOptions.body instanceof FormData)) {
      Object.assign(fetchOptions.query, fetchOptions.body);
    }

    if (methods.has(options.method)) {
      Object.assign(fetchOptions, {
        method: options.method,
      });
    }

    if (Array.isArray(options.middlewares)) {
      fetchOptions.middlewares.push(...options.middlewares);
    }

    if (objectUtils.isObject(options.headers)) {
      Object.assign(fetchOptions, {
        headers: Object.assign(fetchOptions.headers, options.headers),
      });
    }

    if (typeof options.timeout === 'number') {
      Object.assign(fetchOptions, {
        timeout: options.timeout,
      });
    }

    fetchOptions.middlewares.push(resultFilter);

    return fetchOptions;
  }
}

module.exports = APICall;
