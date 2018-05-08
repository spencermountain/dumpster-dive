const pretty = require('prettysize');
const WorkerNodes = require('worker-nodes');
const fs = require("fs");
const chalk = require('chalk')
const EventEmitter = require('events');
const margin = '            '

class WorkerPool extends EventEmitter {
  constructor(options) {
    super()
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
    console.log(margin + `total file size: ${chalk.green(pretty(this.fileSize))}`)
    console.log(margin + 'creating ' + chalk.blue(this.workers + ' workers') + ``)
    console.log(margin + chalk.grey('-') + ` each worker will be given: ${chalk.magenta(pretty(this.chunkSize))} ` + chalk.grey('-'));
    console.log(margin + ' ----------')
    console.log('\n')
  }

  isDone() {
    console.log('\n')
    console.log('    💪  a worker has finished 💪 ')
    this.running -= 1
    console.log(chalk.grey('      - ' + this.running + ' workers still running -\n'))
    if (this.running === 0) {
      this.workerNodes.terminate().then((resolve) => {
        this.emit("allWorkersFinished"); //send this up to parent
        resolve()
      })
    }
  }

  onMsg(msg) {
    this.emit("msg", msg);
    if (msg.type === "workerDone") {
      this.isDone()
    }
  }

  start() {
    let self = this
    let options = this.options
    this.printHello()
    for(let i = 0; i < self.workers; i += 1) {
      self.workerNodes.call.doSection(options, this.chunkSize, i).then(() => {
        self.running += 1
        if (self.running === self.workerCount) {
          self.workerNodes.workersQueue.storage.forEach((worker) => {
            worker.process.child.on("message", self.onMsg)
          })
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
