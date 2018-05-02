const pretty = require('prettysize');
const WorkerNodes = require('worker-nodes');
const fs = require("fs");
const chalk = require('chalk')
const EventEmitter = require('events');
const cpus = require('os').cpus()
const cpuCount = cpus.length;
const ora = require('ora');
const spinner = ora('Opening file..').start();
const margin = '            '

let workerNodes = new WorkerNodes(__dirname + '/worker/index.js', {
  minWorkers: cpuCount - 1,
  autoStart: true,
  maxTasksPerWorker: 1
});

class Workers extends EventEmitter {
  constructor() {
    super()
  }
  start(options) {
    spinner.stop()
    let size = fs.statSync(options.file)["size"];
    console.log('filesize: ' + size)
    let chunkSize = Math.floor(size / cpuCount);
    console.log('\n\n\n' + margin + ' ----------')
    console.log(margin + `  oh hi 👋
`)
    console.log(margin + `total file size: ${chalk.green(pretty(size))}`)
    console.log(margin + chalk.blue(cpuCount + ' cpu cores') + ` detected.`)
    console.log(margin + chalk.grey('-') + ` each worker will be given: ${chalk.magenta(pretty(chunkSize))} ` + chalk.grey('-'));
    console.log(margin + ' ----------')
    console.log('\n')

    var workerCount = 0
    const onMsg = async (msg) => {
      this.emit("msg", msg);
      if (msg.type === "workerDone") {
        console.log('\n')
        console.log('    💪  a worker has finished 💪 ')
        workerCount -= 1
        console.log(chalk.grey('      - ' + workerCount + ' workers still running -\n'))
        if (workerCount === 0) {
          await workerNodes.terminate()
          this.emit("allWorkersFinished");
        }
      }
    }

    cpus.forEach((val, key) => {
      workerNodes.call.doSection(options, chunkSize, key).then(() => {
        workerCount += 1
        if (workerCount === cpuCount) {
          workerNodes.workersQueue.storage.forEach((worker) => {
            worker.process.child.on("message", onMsg)
          })
        }
      })
    })
  }
}

process.on('unhandledRejection', function(up) {
  console.log(chalk.red('--uncaught process error--'))
  return console.log(up);
});


process.on('SIGINT', async function() {
  console.log(chalk.blue("\none sec, cleaning-up the workers..."));
  await workerNodes.terminate();
  return process.exit();
});

let workers = new Workers()
module.exports = {
  worker: workers
}
