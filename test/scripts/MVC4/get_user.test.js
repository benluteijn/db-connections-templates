'use strict';

const loadScript = require('../../utils/load-script');
const fakeSqlServer = require('../../utils/fake-db/sqlserver');

const dbType = 'MVC4';
const scriptName = 'get_user';

describe(scriptName, () => {
  const user = {
    user_id: 'uid1',
    nickname: 'T-Duck',
    email: 'duck.t@example.com'
  };

  const sqlserver = fakeSqlServer({
    callback: (query, callback) => {
      expect(query).toContain('SELECT webpages_Membership.UserId, UserName, UserProfile.UserName from webpages_Membership');

      if (query.indexOf('broken@example.com') > 0) {
        return callback(new Error('test db error'));
      }

      expect(query).toContain('WHERE UserProfile.UserName = duck.t@example.com');

      return callback(null, 1);
    },
    row: (callback) => callback({
      UserId: { value: user.user_id },
      UserName: { value: user.nickname },
      Email: { value: user.email }
    })
  });

  const globals = {};
  const stubs = { 'tedious@1.11.0': sqlserver };

  let script;

  beforeAll(() => {
    script = loadScript(dbType, scriptName, globals, stubs);
  });

  it('should return database error', (done) => {
    script('broken@example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('test db error');
      done();
    });
  });

  it('should return user data', (done) => {
    script('duck.t@example.com', (err, data) => {
      expect(err).toBeFalsy();
      expect(data).toEqual(user);
      done();
    });
  });
});
