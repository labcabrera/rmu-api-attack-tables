const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { createReadStream } = require('fs');
const cache = new Map();

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

const findAttackResult = async (attackTable, size, armorType, roll) => {
    const filePath = path.join(__dirname, '../../tables/attack', `${attackTable}-${size}.csv`);
    if (!fs.existsSync(filePath)) {
        throw { status: 404, message: 'Attack table not found' };
    }
    const data = await parseCSV(filePath);
    const column = `at${armorType}`;
    for (const row of data) {
        const [range0, range1] = row.roll.split('-').map(Number);
        if (roll >= range0 && roll <= range1) {
            return row[column];
        }
    }
    throw { status: 404, message: 'Result not found for the given roll' };
};

module.exports = {
    findAttackResult
};