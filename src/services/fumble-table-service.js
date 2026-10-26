const fs = require('fs');
const { candidateDirs, resolveTableFile } = require('../config/table-paths');

const cache = new Map();

const TABLE_ID = /^[a-z0-9-]+$/;

/** Ids of the fumble tables found in the configured folder and in the bundled one, sorted. */
const listFumbleTables = () => {
    const ids = new Set();
    candidateDirs('fumble')
        .filter((dir) => fs.existsSync(dir))
        .forEach((dir) => fs.readdirSync(dir)
            .filter((file) => file.endsWith('.json') && file !== 'empty-template.json')
            .map((file) => file.slice(0, -5))
            .filter((id) => TABLE_ID.test(id))
            .forEach((id) => ids.add(id)));
    return [...ids].sort();
};

const findFumbleResult = (fumbleTable, roll) => {
    if (!TABLE_ID.test(fumbleTable)) {
        throw { status: 400, message: 'Invalid fumble table identifier' };
    }
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
    return resolveTableFile('fumble', `${fumbleTable}.json`);
};

const getCachedData = (filePath) => {
    if (cache.has(filePath)) {
        return cache.get(filePath);
    }
    if (!fs.existsSync(filePath)) {
        throw { status: 404, message: 'Fumble table file not found' };
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    cache.set(filePath, data);
    return data;
};

module.exports = {
    listFumbleTables,
    findFumbleResult
};