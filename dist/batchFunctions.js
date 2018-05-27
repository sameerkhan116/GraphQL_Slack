"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const channelBatcher = exports.channelBatcher = (() => {
  var _ref = _asyncToGenerator(function* (ids, models, user) {
    const results = yield models.sequelize.query(`
    SELECT DISTINCT ON (id) * 
    FROM channels AS c LEFT OUTER JOIN pcmembers AS pc
    ON c.id = pc.channel_id
    WHERE c.team_id in (:teamIds) AND (c.public = true OR pc.user_id = :userId)`, {
      replacements: {
        teamIds: ids,
        userId: user.id
      },
      model: models.Channel,
      raw: true
    });

    const data = {};

    results.forEach(function (r) {
      if (data[r.team_id]) {
        data[r.team_id].push(r);
      } else {
        data[r.team_id] = [r];
      }
    });

    console.log(data);

    return ids.map(function (id) {
      return data[id];
    });
  });

  return function channelBatcher(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
})();