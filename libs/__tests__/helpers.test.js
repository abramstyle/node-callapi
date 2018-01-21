const helpers = require('../helpers');

describe('helpers', () => {
  test('should apply all middlewares', async () => {
    expect.assertions(2);
    const convertEveryNumberToHalf = async data => Object.assign({}, data, {
      numbers: data.numbers.map(number => number / 2),
    });

    const add3toEveryItem = async data => Object.assign({}, data, {
      numbers: data.numbers.map(number => number + 3),
    });

    const data = {
      name: 'Abram',
      email: 'abram.style@gmail.com',
      numbers: [12, 14, 16, 18, 20],
    };
    const middlewares = [convertEveryNumberToHalf, add3toEveryItem];
    const result = await helpers.applyMiddlewares(middlewares, data);
    expect(result).toEqual({
      name: 'Abram',
      email: 'abram.style@gmail.com',
      numbers: [9, 10, 11, 12, 13],
    });
    const invalidMiddlewareResult = await helpers.applyMiddlewares([null, null], 'xxx');
    expect(invalidMiddlewareResult).toBe('xxx');
  });
});
