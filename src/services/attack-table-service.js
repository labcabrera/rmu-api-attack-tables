const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const findAttackResult = (attackTable, armorType, roll, callback) => {
    var result = "";
    const fileName = attackTable + '.csv';
    const filePath = path.join(__dirname, '../../tables/attack', fileName);

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
                const attackResult = data[column]
                console.log("roll " + roll + "(" + rollRange + ")" + " -> " + result);
                result = attackResult;
            } else {
                console.log("!roll " + roll + "(" + rollRange + ")");
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