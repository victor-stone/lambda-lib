## Vanilla API

````javascript
// handler.js

const { LambdaFunc } = require('lambda-lib');

class MyAdditionFunc extends LambdaFunc {

  perform() {

    const { arg1, arg2 } = this.body;

    this.response( { result: arg1 + arg2 } );
  }
}

const MyAsyncFunc extends LambdaFunc {

  perform() {

    const { someArg } = this.body;

    somePromiseThing( someArg )
      .then( this.thenHandler )
      .catch( this.errorHandler );
  }
}

module.exports = {
  addition: (new MyAdditionFunc()).handler,
  asyncthing: (new MyAsyncFunc()).handler
}
````
## REST DynamoDB table
````javascript
// handler.js 

const { RESTService } = require('lambda-lib');

class UserTable extends RESTService {

  get Key() {
    const { email = null } = this.params;
    return { email };
  }
}

module.exports = (new UserTable()).exports;
````