#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const exec = require('child_process').exec;
const Getopt = require('node-getopt');

/**
 * Generate an index.js that we can export as the client SDK
 * for our Lambda APIs.
 * 
 * The result is a single export with the shape:
 * <code> { 
 *       dev: {
 *         api1: config => <returns initialized API1 for dev stage>
 *         ....
 *       },
 *       prod: {
 *         api1: config => <returns initialized API1 for prod stage>
 *         ....
 *       }
 *     }
 * </code>
 * 
 * Which means websites can:
 * <code>
 *   import bellman from 'bellman';
 * 
 *      const api1 = bellman.dev.api1( <IAM auth session stuff> );
 * 
 *       ap1.someMethod( someParam )
 *          .then( ok => ... )
 *          .catch( err => ... )
 * 
 * </code>
 * 
 * WARNING: this way lies sausage making...
 * 
*/
function genLambdaClient() {
  const getopt = new Getopt([
    ['s', 'srcdir=dir', 'directory to parse'],
    ['d', 'destdir=dir', 'directory to put generated client code'],
    ['h', 'help', 'this help']
  ]).bindHelp();
  const opt = getopt.parseSystem();
  const { options: { srcdir, destdir } } = opt;
  if (!srcdir || !destdir) {
    getopt.showHelp();
    process.exit(-1);
  }
  
  const srcdir   = path.join(srcdir,'/');
  const destdir  = path.join(destdir,'/');
  const spec     = srcdir + '**/*.yml';
  const allTasks = [];

  /*
    We have to extract the endpoint from calling 'serverless info'
  */
  const endpoint = (apiName, stage) => new Promise((resolve, reject) => {
    process.chdir(srcdir + apiName);
    exec('serverless info -v -s ' + stage, function (err, stdout, stderr) {
      if (stderr) {
        reject(stderr);
      }
      else {
        const m = stdout && stdout.toString().match(/ServiceEndpoint:\s([^\n]+)/);
        resolve({ endpoint: m && m[1], stage, apiName });
      }
    });
  });
  
  const stages = {
    prod: {},
    dev: {}
  };
  
  /*
    Manage require statements
  */
  const requires = [];
  let tokens = 'abcdefghijklmnopqrstuvwxy';
  let token = 0;
  const pushReq = name => (requires.push(`const ${tokens[token]} = require('./${name}');\n`), tokens[token++]);
  const serviceClass = pushReq('lib/Service');
  
  /*
    Generate the 'export' statement
  */
  const genJS = ({ endpoint, stage, apiName }) => {
    if (!endpoint) {
      return;
    }
    const baseclass = fs.existsSync(destdir + apiName)
      ? pushReq(apiName)
      : serviceClass;
    stages[stage][apiName] = ` cfg => new ${baseclass}({...cfg,endpoint:'${endpoint}',slug:'${apiName}'})`;
  };
  
  /*
    Put it all together given a path
  */
  const processFile = f => {
    const apiName = path.parse(f).dir.replace(srcdir, '');
    allTasks.push(endpoint(apiName, 'prod')
      .then(genJS)
      .then(() => endpoint(apiName, 'dev'))
      .then(genJS));
  };
  /*
    Generate the Javascript
  */
  const flatten = obj => {
    if (typeof obj === 'object') {
      return `{\n   ` + Object.keys(obj).map(k => `${k}: ` + flatten(obj[k])).join(`,\n`) + '}';
    }
    else {
      return '' + obj;
    }
  };

  const template = (requires, stages) => `
/* auto generated */ 
${requires.join('\n')}
module.exports = ${flatten(stages)};
`;
  const genReport = () => {
    fs.writeFileSync(destdir + 'index.js', template(requires, stages));
    console.log(destdir + 'index.js written');
  };
  /*
  
  */
  glob(spec, (err, files) => {
    files.forEach(processFile);
    Promise.all(allTasks)
      .then(genReport)
      .catch(err => console.log(err));
  });
}

genLambdaClient();
