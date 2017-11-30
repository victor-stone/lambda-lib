const { LambdaFunc } = require('lambda-lib');

class MyAdditionFunc extends LambdaFunc {

  perform() {

    const { arg1, arg2 } = this.body;

    this.response( { result: arg1 + arg2 } );
  }
}

class MyAsyncFunc extends LambdaFunc {

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