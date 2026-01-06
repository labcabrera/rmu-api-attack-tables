const fs = require('fs');
const path = require('path');

const cache = new Map();

const findCriticalResult = (criticalTable, criticalType, roll, location) => {
    const filePath = getFilePath(criticalTable, criticalType);
    const data = getCachedData(filePath);
    let i = roll;
    while (i > 1) {
        const item = getItem(data, i, location);
        if (item) {
            return item;
        }
        i--;
    }   
    return     {
        "rollMin": 0,
        "rollMax": 0,
        "dmg": 0,
        "effects": [],
        "location": null,
        "message": "Critial has no efect using the given location"
    };
};

const getItem = (data, roll, location) => {
    for (const item of data) {
        if (roll >= item.rollMin && roll <= item.rollMax) {
            if(!location) return item;
            if(item.location === location && roll !== 66) return item;
        }
    }
    return null;
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