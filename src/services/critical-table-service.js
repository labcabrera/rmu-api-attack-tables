const fs = require('fs');
const path = require('path');

const cache = new Map();

const findCriticalResult = (criticalTable, criticalType, roll, location) => {
    validateType(criticalType);
    const isZType = criticalType === 'Z';
    const adjustedType = isZType ? 'A' : criticalType;
    const filePath = getFilePath(criticalTable, adjustedType);
    const data = getCachedData(filePath);
    
    const zItem = isZType ? getItem(data, roll, null) : null;
    const zCheckLocation = isZType ? zItem.location : null;
    const adjustedRoll = zItem ? (zItem.rollMin !== 67 ? zItem.rollMin - 1 : roll - 2) : roll;
    const adjustedLocation = isZType ? zCheckLocation : location;
    let i = adjustedRoll;

    while (i > 1) {
        const item = getItem(data, i, adjustedLocation);
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

const validateType = (type) => {
    const validTypes = ['A', 'B', 'C', 'D', 'E', 'Z'];
    if (!validTypes.includes(type)) {
        throw { status: 400, message: 'Invalid critical type ' + type };
    }
}

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