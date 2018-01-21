const mime = require('mime-types');

async function responseParser(data) {
  const resultData = Object.assign({}, data);
  const { response } = data;
  if (!response) {
    return data;
  }

  const { headers } = response;
  const contentType = headers.get('content-type');
  const type = mime.extension(contentType) || 'text';
  let result = null;
  if (type === 'json') {
    result = await response.json();
  } else if (type === 'text') {
    const text = await response.text();
    try {
      result = JSON.parse(text);
    } catch (e) {
      result = text;
    }
  } else {
    result = response || {};
  }

  Object.assign(resultData, {
    data: result,
  });

  return resultData;
}

async function resultTransformer(data) {
  const { response } = data;
  if (!response) {
    return data;
  }
  const { ok: isSuccess } = response;
  const fetchData = Object.assign({}, data);

  if (!isSuccess) {
    const error = new Error(response.statusText);
    error.response = response;
    error.status = response.status;
    error.data = data.data;
    Object.assign(fetchData, {
      error,
    });
  }

  return fetchData;
}

async function resultFilter(data) {
  const { data: result, error } = data;
  if (error) {
    throw error;
  }
  return result;
}

// function errorCollector(result, options) {
//   const errorHandler = require('../../services/errorHandler');
//
//   return new Promise((resolve, reject) => {
//     if (options.response.ok) {
//       return resolve(options.response);
//     }
//     // here we do some thing
//     // send error message,
//     // write a log etc.
//     const error = new Error(options.response.statusText);
//     error.response = options.response;
//     error.url = options.endpoint;
//     if (error.response.status !== 404) {
//       errorHandler.captureException(error);
//     }
//     return reject(error);
//   });
// }
//
//
// function logAPICall(result, options) {
//   const logger = require('../logger');
//
//   return new Promise((resolve, reject) => {
//     const callAPIInfo = {
//       type: 'APICALL_LOG',
//       urlPath: options.endpoint,
//       httpStatusCode: options.response.status,
//       requestId: (options.response.headers._headers || {})['x-request-id'],
//       hostname: '', // 此参数拿不到
//       ok: options.response.ok,
//       options: options.fetchOptions,
//       userIp: '',
//       requestHeader: {},
//       responseHeader: options.response.headers,
//       size: options.response.size,
//       duration: `${options.duration}ms`,
//     };
//
//     logger.log(callAPIInfo);
//
//     if (options.ok) {
//       resolve(result);
//     } else {
//       reject(options.error);
//     }
//   });
// }

exports.resultFilter = resultFilter;
exports.responseParser = responseParser;
exports.resultTransformer = resultTransformer;
// exports.errorCollector = errorCollector;
// exports.responseParser = responseParser;
// exports.logAPICall = logAPICall;
