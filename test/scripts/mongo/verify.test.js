'use strict';

const loadScript = require('../../utils/load-script');

const dbType = 'mongo';
const scriptName = 'verify';

describe(scriptName, () => {
  const update = jest.fn();
  const mongodb = (conString, callback) => {
    expect(conString).toEqual('mongodb://user:pass@mymongoserver.com/my-db');

    callback({ collection: () => ({ update })});
  };

  const globals = {};
  const stubs = { mongodb };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    update.mockImplementation((query, data, callback) => callback(new Error('test db error')));

    script('broken@example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should not update user, if email already validated', (done) => {
    update.mockImplementation((query, data, callback) => callback(null, 0));

    script('validated@example.com', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(false);
      done();
    });
  });

  it('should update user', (done) => {
    update.mockImplementation((query, data, callback) => {
      expect(query.email).toEqual('duck.t@example.com');
      expect(query.email_verified).toEqual(false);
      expect(data.$set.email_verified).toEqual(true);

      callback(null, 1)
    });

    script('duck.t@example.com', (err, success) => {
      expect(err).toBeFalsy();
      expect(success).toEqual(true);
      done();
    });
  });
});
