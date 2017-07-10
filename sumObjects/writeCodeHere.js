var _ = require('lodash');

function sumObjects(arr) {
  return _.reduce(arr, sum2Objects, {});
}

function sum2Objects(obj1, obj2) {
  var keys1 = _.keys(obj1);
  var keys2 = _.keys(obj2);
  var allKeys = _.uniq(keys1.concat(keys2));

  return _.reduce(allKeys, function(acc, key) {
    var val1 = obj1[key] || 0;
    var val2 = obj2[key] || 0;
    acc[key] = val1 + val2;
    return acc;
  }, {});
}

console.log(sumObjects([
  { a: 1, b: 2 },
  { a: 1, b: 2 },
  { b: 2, c: 3 }
]));
