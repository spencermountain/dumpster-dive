const pretty = require('prettysize');
const WorkerNodes = require('worker-nodes');
const fs = require("fs");
const chalk = require('chalk')
const EventEmitter = require('events');
const margin = '            '

class WorkerPool extends EventEmitter {
  constructor(options) {
    super()
    this.options = options
    this.workerCount = options.workers
    this.running = 0
    this.workerNodes = new WorkerNodes(__dirname + '/worker/index.js', {
      minWorkers: this.workers,
      autoStart: true,
      maxTasksPerWorker: 1
    });
    this.fileSize = fs.statSync(options.file)["size"];
    this.chunkSize = Math.floor(this.fileSize / this.workerCount);
  }

  printHello() {
    console.log('\n\n\n' + margin + ' ----------')
    console.log(margin + `  oh hi 👋`)
    console.log('\n')
    console.log(margin + `file size: ${chalk.green(pretty(this.fileSize))}`)
    console.log(margin + 'creating  ' + chalk.blue(this.workerCount + ' workers') + ``)
    console.log(margin + `each worker:  ${chalk.magenta(pretty(this.chunkSize))}`);
    console.log(margin + ' ----------')
    console.log('\n')
  }

  isDone() {
    this.running -= 1
    console.log(chalk.grey('      - ' + this.running + ' workers still running -\n'))
    if (this.running === 0) {
      this.workerNodes.terminate().then(() => {
        this.emit("allWorkersFinished"); //send this up to parent
      })
    }
  }

  //pay attention to them when they finish
  listen() {
    this.workerNodes.workersQueue.storage.forEach((worker) => {
      worker.process.child.on("message", (msg) => {
        this.emit("msg", msg);
        if (msg.type === "workerDone") {
          this.isDone()
        }
      })
    })
  }

  start() {
    let self = this
    let options = this.options
    this.printHello()
    //convoluted loop to wire-up each worker
    for(let i = 0; i < self.workerCount; i += 1) {
      self.workerNodes.call.doSection(options, this.workerCount, i).then(() => {
        self.running += 1
        //once all workers have been started..
        if (self.running === self.workerCount) {
          self.listen()
        }
      })
    }
  }

  cleanup() {
    console.log(chalk.blue("\none sec, cleaning-up the workers..."));
    this.workerNodes.terminate();
  }
}

module.exports = WorkerPool
