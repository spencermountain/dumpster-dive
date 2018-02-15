const pretty = require('prettysize');
const WorkerNodes = require('worker-nodes');
const fs = require("fs");
const EventEmitter = require('events');
const cpus = require('os').cpus()
const cpuCount = cpus.length;

let workerNodes = new WorkerNodes(__dirname + '/worker/index.js', {
  minWorkers: cpuCount - 1,
  autoStart: true,
  maxTasksPerWorker: 1
});

workerLogs = {};

workerLog = function(msg) {
  var name;
  if (msg) {
    if (workerLogs[name = msg.pid] === undefined) {
      workerLogs[name] = {};
    }
    return workerLogs[msg.pid] = msg;
  }
  return null
};

class Worker extends EventEmitter {
  constructor() {
    super()
  }
  parseXML(options) {
    var chunkSize,
      size;
    size = fs.statSync(options.file)["size"];
    // size = 633279000
    chunkSize = Math.floor(size / cpuCount);
    console.log(`${cpuCount} cpu cores detected. file size: ${pretty(size)} file will be divided into: ${cpuCount} each process will be given: ${pretty(chunkSize)}`);
    console.log(`launching ${cpuCount} processes. do ctrl-c to kill all.`);
    console.log("do tail -f /tmp/worker.logs on a separate terminal window for logs.");

    //await workerNodes.ready();
    var workerCount = 0
    const onMsg = async (msg) => {
      this.emit("msg", msg);
      if (msg.type === "workerDone") {
        workerCount -= 1
        console.log(workerCount + ' workers still running..')
        if (workerCount === 0) {
          await workerNodes.terminate()
          this.emit("allWorkersFinished");
        }
      }
    }

    cpus.forEach((val, key) => {
      workerNodes.call.getPages(options, chunkSize, key).then(() => {
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
  return console.log(up);
});


process.on('SIGINT', async function() {
  console.log("Cleaning up child processes...");
  await workerNodes.terminate();
  return process.exit();
});

worker = new Worker()

module.exports = {
  worker: worker
}
