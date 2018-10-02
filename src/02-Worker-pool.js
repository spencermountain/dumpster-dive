const pretty = require('prettysize');
const WorkerNodes = require('worker-nodes');
const fs = require('fs');
const chalk = require('chalk');
const jsonfn = require('jsonfn').JSONfn;
const EventEmitter = require('events');
const fns = require('./lib/fns');
const right = fns.alignRight;
const niceTime = fns.niceTime;
const margin = '         ';
//estimate of duration:
const mbPerMinute = 45; //new macbooks are ~58

class WorkerPool extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.workerCount = options.workers;
    this.running = 0;
    this.workerNodes = new WorkerNodes(__dirname + '/worker/index.js', {
      minWorkers: this.workers,
      autoStart: true,
      maxTasksPerWorker: 1
    });
    this.skippedRedirects = 0
    this.skippedDisambigs = 0
    this.fileSize = fs.statSync(options.file)['size'];
    this.chunkSize = Math.floor(this.fileSize / this.workerCount);
  }

  printHello() {
    let megaBytes = this.chunkSize / 1048576; //1,048,576
    let duration = megaBytes / mbPerMinute;
    console.log('\n\n\n' + margin + '---------------------------');
    console.log(margin + chalk.yellow(`         oh hi `) + `👋`);
    console.log(margin + chalk.green(`size:`) + `        ${chalk.green(right(pretty(this.fileSize)))}`);
    console.log(margin + `             ${chalk.blue(right(this.workerCount + ' workers'))}`);
    console.log(margin + `             ${chalk.magenta(right(pretty(this.chunkSize) + ' each'))}`);
    console.log(margin + chalk.red(`estimate:`) + `    ${chalk.red(right(niceTime(duration)))}`);
    console.log(margin + '---------------------------');
    console.log('\n');
  }

  isDone() {
    this.running -= 1;
    console.log(chalk.grey('      - ' + this.running + ' workers still running -\n'));
    if (this.running === 0) {
      this.workerNodes.terminate().then(() => {
        this.emit('allWorkersFinished'); //send this up to parent
      });
    }
  }

  //pay attention to them when they finish
  listen() {
    this.workerNodes.workersQueue.storage.forEach((worker) => {
      worker.process.child.on('message', (msg) => {
        // this.emit('msg', msg);
        if (msg.type === 'workerDone') {
          this.isDone();
        }
      });
    });
  }

  start() {
    let self = this;
    let options = this.options;
    this.printHello();
    //convoluted loop to wire-up each worker
    for(let i = 0; i < self.workerCount; i += 1) {
      //stringify options, so it gets passed to the web worker
      let optionStr = jsonfn.stringify(options);
      self.workerNodes.call.doSection(optionStr, this.workerCount, i).then(() => {
        self.running += 1;
        //once all workers have been started..
        if (self.running === self.workerCount) {
          self.listen();
        }
      });
    }
  }

  cleanup() {
    console.log(chalk.blue('\none sec, cleaning-up the workers...'));
    this.workerNodes.terminate();
  }
}

module.exports = WorkerPool;
