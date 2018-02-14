var WorkerNodes, cpuCount, fs, start, workerLog, workerLogs, workerNodes;
const pretty = require('prettysize');
WorkerNodes = require('worker-nodes');
fs = require("fs");
const EventEmitter = require('events');
cpus = require('os').cpus()
cpuCount = cpus.length;

workerNodes = new WorkerNodes(__dirname + '/worker.js', {
  minWorkers: cpuCount-1,
  autoStart: true,
  maxTasksPerWorker: 1
});

workerLogs = {};

workerLog = function(msg) {
  var name;
  if (msg) {
    if (workerLogs[name = msg.pid] == null) {
      workerLogs[name] = {};
    }
    return workerLogs[msg.pid] = msg;
  }
};

class Worker extends EventEmitter {
  constructor(){
    super()
  }
  parseXML (options) {
    var chunkSize, size;
    size = fs.statSync(options.file)["size"];
    // size = 633279000
    chunkSize = Math.floor(size / cpuCount);
    console.log(`${cpuCount} cpu cores detected. file size: ${pretty(size)} file will be divided into: ${cpuCount} each process will be given: ${pretty(chunkSize)}`);
    console.log(`launching ${cpuCount} processes. do ctrl-c to kill all.`);
    console.log("do tail -f /tmp/worker.logs on a separate terminal window for logs.");


    //await workerNodes.ready();
    var workerCount = 0
    cpus.forEach((val,key) => {
      workerNodes.call.xmlSplit(options, chunkSize, key).then((msg) => {
        
        workerCount++

        if (workerCount === cpuCount) {
          workerNodes.workersQueue.storage.forEach((worker)=>{
            worker.process.child.on("message", async (msg)=>{
              this.emit("msg",msg);
              if(msg.type === "workerDone"){
                workerCount--
                //console.log(workerCount)
                if (workerCount === 0) {
                  //console.log("all done.")
                  await workerNodes.terminate()
                  this.emit("allWorkersFinished");
                }
              }
            })
          })
        };
      });
    });
  };

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

module.exports = {worker:worker}
