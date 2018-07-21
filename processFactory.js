const api = require('./api');
const config = require('./config');

const {
    random, 
    randomQueryArr, 
    randomQueryObj,
    randomArrByCondition
} = require('./util');

class ProcessFactory {
    constructor() {
        this.orderCountPrefix = 'ed-';
        this.count = 0;
        this.processNum =  config.process;
        
        // 存储三天的处理流程
        this.day1 = {};
        this.day2 = {};
        this.day3 =  {};
    }

    queryByFreq(freqs) {
        const randomNum = random(0, 100);
        let startNum = 0;
        let lastKey = 0;
        for(let key of Object.keys(freqs)) {
            startNum += freqs[key];
            if (randomNum <= startNum) {
                return key;
            }
            lastKey = key;
        }
        return lastKey;
    }

    orderCount() {
        return `${this.orderCountPrefix}${++this.count}-${Date.now()}`;
    }

    async getBrowseTime() {
        const browseTime = await api.queryData('browseTime'); 
        return randomQueryArr(browseTime);
    }

    async getGoodsCompareNum() {
        const goodsCompareNum = await api.queryData('goodsCompareNum'); 
        return randomQueryArr(goodsCompareNum);
    }

    

    async getCollectionNum(goodsCompareReq, goodsCompareNum) {
        if (goodsCompareReq === '3') {
            return 0;
        }

        const collectionNum = await api.queryData('collectionNum');
        return randomArrByCondition(collectionNum, 0, goodsCompareNum);
    }

    async getAddToShoppingCartNum(goodsCompareReq, goodsCompareNum) {
        if (goodsCompareReq === '3') {
            return 0;
        }

        const addToShoppingCartNum = await api.queryData('addToShoppingCartNum');
        if (['4', '5', '6'].includes(goodsCompareReq)) {
            return randomArrByCondition(addToShoppingCartNum, 1, goodsCompareNum); 
        } 
        return randomArrByCondition(addToShoppingCartNum, 0, goodsCompareNum); 
    }

    async getIsAskKey() {
        const isAsk = await api.queryData('isAsk');
        const isAskKey = this.queryByFreq(isAsk.freq);
        return isAskKey;
    }

    async getQuestions(isAsk) {
        if (isAsk === '1') {
            const questions = await api.queryData('questions');
            return randomQueryObj(questions.content, questions.count);
        }
        return [];
    }

    async getKeyword(entryKey) {
        if (['1-1', '1-2'].includes(entryKey)) {
            const keywords = await api.queryData('keywords');
            return randomQueryObj(keywords);
        }
        return '';
    }
    
    handleEntry2(day) {
        const arr = []
        if (['1-1', '1-2'].includes(this.day1.entry) || ['1-1', '1-2'].includes(this.day2.entry)) {
            arr.push('2-1');
        }
        if (this.day1.addToShoppingCartNum > 0 || this.day2.addToShoppingCartNum > 0) {
            arr.push('2-2');
        }
        return arr;
    }

    generateEntryKey(type, entry) {
        return `${type}-${this.queryByFreq(entry[type].freq)}`;
    }

    async getEntryKey(day) {
        const entry = await api.queryData('entry');
        if (day === 1) {
            return this.generateEntryKey('1', entry);
        }

        const checkingEntry2 = this.handleEntry2(day);
        if (checkingEntry2.length > 0) {
            const key = this.queryByFreq({
                '1': entry['1'].freqSum,
                '2': entry['2'].freqSum,
            })
            if (key === '1') {
                return this.generateEntryKey('1', entry);
            } else {
                if (checkingEntry2.length === 1) {
                    return checkingEntry2[0];
                } else {
                    return this.generateEntryKey('2', entry);
                }
            }
        }
        
        return this.generateEntryKey('1', entry);
    }
    
    /**
     * 计算前些天 加购总数
     * @param {number} day 
     */
    calculateShoppingCartNum(day) {
        if (day ===  2) {
            return this.day1.addToShoppingCartNum;
        } else if (day ===  3) {
            return this.day1.addToShoppingCartNum + this.day2.addToShoppingCartNum;
        }
        return 0;
    }

    async getGoodsCompareReqKey(day) {
        const goodsCompareReq =  await api.queryData('goodsCompareReq');

        if (day === 1 || this.calculateShoppingCartNum(day) < 2) {
            return this.queryByFreq(goodsCompareReq.type["A"]);
        } 
        return this.queryByFreq(goodsCompareReq.type["B"]);
    }

    async generateDay(day) {
        const entry = await this.getEntryKey(day);
        const keyword = await this.getKeyword(entry);
        const goodsCompareReq = await this.getGoodsCompareReqKey(day);
        const goodsCompareNum = await this.getGoodsCompareNum();
        const collectionNum = await this.getCollectionNum(goodsCompareReq, goodsCompareNum);
        const addToShoppingCartNum = await this.getAddToShoppingCartNum(goodsCompareReq, goodsCompareNum);
        const isAsk = await this.getIsAskKey();
        const questions = await this.getQuestions(isAsk);
        const browseTime = await this.getBrowseTime();

        return {
            day,
            entry,
            keyword,
            goodsCompareReq,
            goodsCompareNum,
            collectionNum,
            addToShoppingCartNum,
            isAsk,
            questions,
            browseTime
        }; 
    }
    
    async formatDay(orderCount, day) {
        const entry = await api.queryData('entry');
        const goodsCompareReq =  await api.queryData('goodsCompareReq');
        const entryType = day.entry.split('-');

        day.orderCount = orderCount;
        day.entry = entry[entryType[0]].content[entryType[1]];
        day.goodsCompareReq = goodsCompareReq.content[day.goodsCompareReq]
        day.isAsk = Number.parseInt(day.isAsk, 10);
        return day;
    }
    
    /**
     * 组装流程，添加统一的代号
     * 格式化
     */
    async buidProcess() {
        const orderCount = this.orderCount();
        this.day1 = await this.formatDay(orderCount, await this.generateDay(1));
        this.day2 = await this.formatDay(orderCount, await this.generateDay(2));
        this.day3 = await this.formatDay(orderCount, await this.generateDay(3));

        console.log(this.day1);
        console.log(this.day2);
        console.log(this.day3);
        api.addHistory(this.day1);
        api.addHistory(this.day2);
        api.addHistory(this.day3);
    }

    start() {
        for(let i = 0; i < this.processNum; i++) {
            this.day1 = {};
            this.day2 = {};
            this.day3 = {};
            this.buidProcess();
        }
    }
}


module.exports = ProcessFactory;
