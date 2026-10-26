const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { candidateDirs, resolveTableFile } = require('../config/table-paths');
const { createReadStream } = require('fs');
const cache = new Map();

// Only the Medium tables are served (spec 033): tactical derives the other attack sizes from them.
const TABLE_ID = /^[a-z0-9-]+$/;

const parseCSV = (filePath) => {
    if (cache.has(filePath)) {
        return Promise.resolve(cache.get(filePath));
    }
    return new Promise((resolve, reject) => {
        const results = [];
        createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                cache.set(filePath, results);
                resolve(results);
            })
            .on('error', (error) => reject(error));
    });
};

/** Ids of the attack tables found in the configured folder and in the bundled one, sorted. */
const listAttackTables = () => {
    const ids = new Set();
    candidateDirs('attack')
        .filter((dir) => fs.existsSync(dir))
        .forEach((dir) => fs.readdirSync(dir)
            .filter((file) => file.endsWith('.csv'))
            .map((file) => file.slice(0, -4))
            .filter((id) => TABLE_ID.test(id))
            .forEach((id) => ids.add(id)));
    return [...ids].sort();
};

const findAttackResult = async (attackTable, armorType, roll) => {
    if (!TABLE_ID.test(attackTable)) {
        throw { status: 400, message: 'Invalid attack table identifier' };
    }
    const filePath = resolveTableFile('attack', `${attackTable}.csv`);
    if (path.basename(filePath) !== `${attackTable}.csv` || !fs.existsSync(filePath)) {
        throw { status: 404, message: 'Attack table not found' };
    }
    const data = await parseCSV(filePath);
    const column = `at${armorType}`;
    const bands = data.map((row) => ({ row, range: row.roll.split('-').map(Number) }));
    const band = bands.find(({ range }) => roll >= range[0] && roll <= range[1]);
    if (band) {
        return band.row[column];
    }
    // Above the top band (the ball tables end at 125): the top row applies
    const top = bands.reduce((max, current) => (current.range[1] > max.range[1] ? current : max), bands[0]);
    if (top && roll > top.range[1]) {
        return top.row[column];
    }
    throw { status: 404, message: 'Result not found for the given roll' };
};

module.exports = {
    listAttackTables,
    findAttackResult
};
