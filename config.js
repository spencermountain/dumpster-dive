module.exports = {
  //number of pages to write at a time, to the queue
  batch_size: 200,
  //the default name of the collection to write to
  collection: 'pages',
  //update interval
  logInterval: 10000,
  //which wikipedia namespace to parse
  namespace: 0,
  // the location of the mongo database
  // change to support authentication credentials
  db_url: 'mongodb://localhost:27017/'
};
