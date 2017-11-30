const { RESTService } = require('lambda-lib');

class UserTable extends RESTService {

  get Key() {
    const { email = null } = this.params;
    return { email };
  }

}

module.exports = (new UserTable()).exports;
