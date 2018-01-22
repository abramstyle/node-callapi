# Node Call API
Making api call with node-fetch, with middleware.

[![npm version](https://badge.fury.io/js/node-callapi.svg)](https://badge.fury.io/js/node-callapi)
[![CircleCI](https://circleci.com/gh/abramstyle/node-callapi/tree/master.svg?style=svg)](https://circleci.com/gh/abramstyle/node-callapi/tree/master)

---

# Basic usage
```js
const Caller = require('node-callapi');
const caller = new Caller(setting);

caller.call(endpoint, options)
```

# Constructor
```js
new Caller(options);
```
## `options.middlewares`
middlewares will be applied after every request finished.

# Middleware
a middleware is an async function, it recevied an object. and returns a object that has the shape same as received data.
```js
async function middleware(data) {
  const {
    // fetch options
    fetchOptions,

    // the endpoint
    url,

    // response, if no response, it will be null
    response,

    // the request duration
    duration,

    // if any error occured, it will be an Error instance
    error,

    // the result data, it will be one of [array, object, string, null]
    data,
  } = data;
  // do something
  return result;
}
```

## `data.error`
name | description
---- | ----
`error.status` | the response status
`error.fetchOptions` | the fetch options
`error.duration` | the time of the fetch request processing time
`error.data` | the data from server, it will parsed even if request failed
`error.response` | the full response object
`error.url` | the fetch url

# api
## call(url, options)

url should use absolute url.

it will return the parsed result.

### `options.method`(optional)
request method. should be one of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE', 'HEAD', 'CONNECT'].

### `options.data`
send data to server if use 'POST', 'PUT' method.

### `options.middlewares`
append middlewares. should be a valid middleware.

### `options.headers`
append headers. should be an key-value object.
