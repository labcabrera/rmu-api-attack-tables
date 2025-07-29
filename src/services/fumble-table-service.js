const fs = require('fs');
const path = require('path');

const cache = new Map();

const findFumbleResult = (fumbleTable, roll) => {
    const filePath = getFilePath(fumbleTable);
    const data = getCachedData(filePath);
    for (const item of data) {
        if (roll >= item.rollMin && roll <= item.rollMax) {
            return item;
        }
    }
    throw { status: 400, message: 'Invalid fumble table data' };
};

const getFilePath = (fumbleTable) => {
    return path.join(__dirname, '../../tables/fumble', `${fumbleTable}.json`);
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
    findFumbleResult
};