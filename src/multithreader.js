const filesize = require('filesize');
const fs = require("fs");
const WorkerNodes = require('worker-nodes');
const cpus = require('os').cpus()
const cpuCount = cpus.length;

workerNodes = new WorkerNodes(__dirname + '/worker.js', {
  minWorkers: cpuCount - 1,
  autoStart: true,
  maxTasksPerWorker: 1
});

// let workerLogs = {};
// const workerLog = function(msg) {
//   var name;
//   if (msg) {
//     if (workerLogs[name = msg.pid] === undefined) {
//       workerLogs[name] = {};
//     }
//     workerLogs[msg.pid] = msg;
//   }
// };

const start = async function(options) {
  var chunkSize,
    size;
  size = fs.statSync(options.file)["size"];
  chunkSize = Math.floor(size / cpuCount);
  console.log(`${cpuCount} cpu cores detected.
    ${filesize(size)} file will be divided into ${cpuCount} zones
     - each process will be given: ${filesize(chunkSize)}

ok, launching ${cpuCount} processes. do ctrl-c to kill all.
do tail -f ./worker.logs on a separate terminal window for logs.
`)


  await workerNodes.ready();
  cpus.forEach((val, key) => {
    workerNodes.call(options, chunkSize, key);
  });
};

process.on('unhandledRejection', function(up) {
  return console.log(up);
});

// setInterval((function() {}), 2000);

process.on('SIGINT', async function() {
  console.log("Cleaning up child processes...");
  await workerNodes.terminate();
  return process.exit();
});

module.exports = {
  start: start
}
