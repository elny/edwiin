const AV = require('leancloud-storage');

// 初始化存储服务
AV.init('5jDeO2RV6hLzaATvCo6H3GV6-gzGzoHsz', 'cAvYMBnUGVlscsmETkA08xxA');

const queryData = (function () {
  let allData;
  return async function(name) {
    if (allData) {
      return allData.get(name);
    } else {
      const Data = new AV.Query('Data');
      return new Promise(function(resolve, reject) {
        Data.get('5b4f4264fe88c200358127fa').then(function (data) {
          // 成功获得实例
          allData = data;
          resolve(data.get(name));
        }, function (error) {
          reject(error);
        });
      })
    }
  }
})();

// 声明类型
const History = AV.Object.extend('History');
const addHistory = function(obj) {
    // 新建对象
    var history = new History(obj);
    // 设置名称
    history.save().then(function (todo) {
      console.log('objectId is ' + todo.id);
    }, function (error) {
      console.error(error);
    });
}

module.exports = {
  queryData,
  addHistory
}