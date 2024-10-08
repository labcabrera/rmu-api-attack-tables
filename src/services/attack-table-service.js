const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const findAttackResult = (attackTable, size, armorType, roll, callback) => {
    var result = "";
    const filePath = path.join(__dirname, '../../tables/attack', `${attackTable}-${size}.csv`);

    if (!fs.existsSync(filePath)) {
        throw { status: 400, message: 'Attack table not found' };
    }

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            const rollRange = data.roll;
            const column = "at" + armorType;
            const range0 = parseInt(rollRange.split("-")[0]);
            const range1 = parseInt(rollRange.split("-")[1]);
            if (roll >= range0 && roll <= range1) {
                result = data[column];
            }
        })
        .on('end', () => {
            callback(null, result);
        })
        .on('error', (error) => {
            callback(error, null);
        });
};

module.exports = {
    findAttackResult
};