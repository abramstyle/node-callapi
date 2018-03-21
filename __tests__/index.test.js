const nock = require('nock');
const FormData = require('form-data');
const APICall = require('../index');
const { resultFilter } = require('../libs/defaultMiddlewares');

afterEach(() => {
  nock.cleanAll();
});
describe('serializeUrl', () => {
  test('will append query string to url ', () => {
    const apiCall = new APICall();
    expect(apiCall.serializeUrl('http://a.test.com', {
      query: {
        a: 1,
        b: 2,
      },
    })).toBe('http://a.test.com/?a=1&b=2');
    expect(apiCall.serializeUrl('http://a.test.com?c=2', {
      query: {
        a: 1,
        b: 2,
      },
    })).toBe('http://a.test.com/?c=2&a=1&b=2');
  });
});
describe('serializeOptions', () => {
  test('fetchOptions default options', () => {
    const apiCall = new APICall();
    const defaultfetchOptions = apiCall.serializeOptions();
    expect(defaultfetchOptions).toEqual({
      credentials: 'same-origin',
      middlewares: [...apiCall.settings.middlewares, resultFilter],
      method: 'GET',
      headers: {},
      body: null,
    });
  });
  test('if send data, fetchOptions will has it', () => {
    const apiCall = new APICall();
    const stringOptions = {
      data: 'data',
    };
    const objectOptions = {
      data: {
        from: 'Node',
      },
    };
    const formData = new FormData();
    const formDataOptions = {
      data: formData,
    };

    const stringFetchOptions = apiCall.serializeOptions(stringOptions);
    const objectFetchOptions = apiCall.serializeOptions(objectOptions);
    const formDataFetchOptions = apiCall.serializeOptions(formDataOptions);
    expect(stringFetchOptions).toEqual({
      credentials: 'same-origin',
      middlewares: [...apiCall.settings.middlewares, resultFilter],
      method: 'GET',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stringOptions.data),
    });
    expect(objectFetchOptions).toEqual({
      credentials: 'same-origin',
      middlewares: [...apiCall.settings.middlewares, resultFilter],
      method: 'GET',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(objectOptions.data),
    });
    expect(formDataFetchOptions).toEqual({
      credentials: 'same-origin',
      middlewares: [...apiCall.settings.middlewares, resultFilter],
      method: 'GET',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formDataOptions.data,
    });
  });

  test('if spefifid method fetchOptions will has it', () => {
    const apiCall = new APICall();
    const options = {
      method: 'PUT',
    };
    const fetchOptions = apiCall.serializeOptions(options);
    expect(fetchOptions).toEqual({
      credentials: 'same-origin',
      middlewares: [...apiCall.settings.middlewares, resultFilter],
      method: 'PUT',
      headers: {},
      body: null,
    });
  });
  test('if middlewares is specified, it will apply to fetchOptions', () => {
    const apiCall = new APICall();
    const middlewares = () => {};
    const options = {
      middlewares: [middlewares],
    };
    const fetchOptions = apiCall.serializeOptions(options);
    expect(fetchOptions).toEqual({
      credentials: 'same-origin',
      middlewares: [...apiCall.settings.middlewares, ...options.middlewares, resultFilter],
      method: 'GET',
      headers: {},
      body: null,
    });
  });
  test('if headers is spefifid, it will apply to fetchOptions', () => {
    const apiCall = new APICall();
    const options = {
      headers: {
        'x-as-from': 'node-call',
      },
    };
    const fetchOptions = apiCall.serializeOptions(options);
    expect(fetchOptions).toEqual({
      credentials: 'same-origin',
      middlewares: [...apiCall.settings.middlewares, resultFilter],
      method: 'GET',
      headers: {
        'x-as-from': 'node-call',
      },
      body: null,
    });
  });

  test('if headers and body specified, fetchOptions will has all that headers', () => {
    const apiCall = new APICall();
    const stringOptions = {
      data: 'data',
      headers: {
        'x-as-from': 'node-call',
      },
    };
    const stringFetchOptions = apiCall.serializeOptions(stringOptions);

    expect(stringFetchOptions).toEqual({
      credentials: 'same-origin',
      middlewares: [...apiCall.settings.middlewares, resultFilter],
      method: 'GET',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'x-as-from': 'node-call',
      },
      body: JSON.stringify(stringOptions.data),
    });
  });
});
describe('call API', () => {
  it('dhould receive error it no url specified', async () => {
    const apiCall = new APICall();
    expect.assertions(1);
    try {
      await apiCall.call();
    } catch (e) {
      expect(e).toEqual(new TypeError('expect url as a string'));
    }
  });
  it('should report error if error occured', async () => {
    const apiCall = new APICall();
    expect.assertions(1);
    try {
      await apiCall.call('/api/call-failed');
    } catch (e) {
      expect(e).toEqual(new Error('only absolute urls are supported'));
    }
  });

  it('will send several response', async () => {
    const apiCall = new APICall();
    const replyText = 'Lorem ipsum dolor sit amet';
    nock('http://api.callapi.com')
      .get('/author')
      .reply(200, {
        author: 'Abram',
        email: 'abram.style@gmail.com',
      })
      .get('/content')
      .reply(200, replyText)
      .get('/private')
      .reply(403, 'You have no Access')
      .get('/internal')
      .reply(500, 'Server Error')
      .post('/user')
      .reply(200, (uri, requestBody) => requestBody)
      .put('/user')
      .reply(200, (uri, requestBody) => ({
        type: 'put',
        body: requestBody,
      }));

    expect.assertions(10);
    const author = await apiCall.call('http://api.callapi.com/author');
    expect(author).toEqual({
      author: 'Abram',
      email: 'abram.style@gmail.com',
    });

    const content = await apiCall.call('http://api.callapi.com/content');
    expect(content).toBe(replyText);

    try {
      await apiCall.call('http://api.callapi.com/private');
    } catch (e) {
      expect(e.data).toBe('You have no Access');
      expect(e.status).toBe(403);
      expect(e).toEqual(new Error('Forbidden'));
    }
    try {
      await apiCall.call('http://api.callapi.com/internal');
    } catch (e) {
      expect(e.data).toBe('Server Error');
      expect(e.status).toBe(500);
      expect(e).toEqual(new Error('Internal Server Error'));
    }
    const response = await apiCall.call('http://api.callapi.com/user', {
      method: 'POST',
      data: {
        type: 'post',
      },
    });
    expect(response).toEqual({
      type: 'post',
    });

    const putResponse = await apiCall.call('http://api.callapi.com/user', {
      method: 'PUT',
      data: {
        type: 'post',
      },
    });
    expect(putResponse).toEqual({
      type: 'put',
      body: {
        type: 'post',
      },
    });
  });
});
