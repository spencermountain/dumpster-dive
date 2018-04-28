
//i am a computer-scientist
exports.oneSec = function(fn) {
  setTimeout(fn, 1000)
}
//add a comma to large numbers
exports.niceNumber = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
