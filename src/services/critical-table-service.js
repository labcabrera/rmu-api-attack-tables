const fs = require('fs');
const path = require('path');

const cache = new Map();

const findCriticalResult = (criticalTable, criticalType, roll) => {
    const filePath = getFilePath(criticalTable, criticalType);
    const data = getCachedData(filePath);
    for (const item of data) {
        if (roll >= item.rollMin && roll <= item.rollMax) {
            return item;
        }
    }
    throw { status: 500, message: 'Invalid critical table data' };
};

const getFilePath = (criticalTable, criticalType) => {
    return path.join(__dirname, '../../tables/critical', `${criticalTable}-${criticalType}.json`);
};

const getCachedData = (filePath) => {
    if (cache.has(filePath)) {
        return cache.get(filePath);
    }
    if (!fs.existsSync(filePath)) {
        throw { status: 404, message: 'Critical table file not found' };
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    cache.set(filePath, data);
    return data;
};

module.exports = {
    findCriticalResult
};