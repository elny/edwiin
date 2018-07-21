function random(min, max) {
    return min + Math.round((max - min) * Math.random());
}

function randomQueryArr(data) {
    return data[random(0, data.length - 1)];
}

function randomArrByCondition(arr, min = 0, max) {
    const _filter = arr.filter((value) => {
        if (max) {
            return value >= min && value <= max;
        }
        return value >= min;
    })
    return randomQueryArr(_filter);
}

function randomQueryObj(data, range) {
    const keys = Object.keys(data);
    const _arr = keys.map((key) => {
        return data[key];
    });
    if (!range) {
        return _arr[random(0, _arr.length - 1)];
    }

    const _tmp = [];
    for(let i = 0; i < range; i++) {
        _tmp.push(_arr.splice(random(0, _arr.length - 1), 1)[0]);
    }
    return _tmp;
}

module.exports = {
    random,
    randomQueryArr,
    randomQueryObj,
    randomArrByCondition,
}