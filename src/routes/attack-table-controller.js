const express = require('express');
const router = express.Router();
const attackTableService = require("../services/attack-table-service");


router.get('/:tableId/:armorType/:roll', (req, res) => {
    try {
        const tableId = req.params.tableId;
        const armorType = readArmorType(req.params.armorType);
        const roll = readRollValue(req.params.roll);
        const callback = (err, data) => {
            if (err) {
                res.status(500).json({ error: 'Error procesando el archivo CSV' });
            } else {
                res.json({ data });
            }
        };
        attackTableService.findAttackResult(tableId, armorType, roll, callback);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const readArmorType = (value) => {
    try {
        const at = parseInt(value);
        if (!at || at < 1 || at > 10) {
            throw { status: 400, message: 'Invalid armor type (1-10)' };
        }
        return at;
    } catch (error) {
        throw { status: 400, message: 'Invalid armor type (1-10)' };
    }
};

const readRollValue = (value) => {
    try {
        const roll = parseInt(value);
        if (!roll || roll < 1 || roll > 175) {
            throw { status: 400, message: 'Invalid roll range (1-175)' };
        }
        return roll;
    } catch (error) {
        throw { status: 400, message: 'Invalid roll range (1-175)' };
    }
}

module.exports = router;