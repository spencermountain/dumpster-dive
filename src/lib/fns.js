//i am a computer-scientist
exports.oneSec = function(fn) {
  setTimeout(fn, 1000);
};

//add a comma to large numbers
exports.niceNumber = x => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

//logger of rough-time since an epoch
exports.timeSince = function(start) {
  const ms = Date.now() - start;
  if (ms < 1000) {
    return ms + 'ms';
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return parseInt(seconds, 10) + 's';
  }
  const minutes = seconds / 60;
  let duration = minutes.toFixed(1) + ' minutes';
  if (minutes > 120) {
    const hours = minutes / 60;
    duration = hours.toFixed(1) + ' hours';
  }
  return duration;
};

exports.alignRight = function(str) {
  return ('      ' + str).slice(-13);
};

exports.niceTime = function(mins) {
  if (mins <= 60) {
    return mins.toFixed(1) + ' mins';
  }
  const hours = mins / 60;
  return hours.toFixed(1) + ' hrs';
};
