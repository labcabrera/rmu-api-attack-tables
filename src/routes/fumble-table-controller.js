const express = require('express');
const router = express.Router();
const fumbleTableService = require("../services/fumble-table-service");

const tables = [
    "melee-one-hand",
    "melee-two-hands",
    "animals",
    "mounted-arms",
    "unarmed",
    "bows",
    "slings",
    "thrown",
    "elemental-bolts",
    "elemental-balls"
];

router.get('/', (req, res) => {
    res.json(tables);
});

router.get('/:tableId/:roll', (req, res) => {
    try {
        const tableId = req.params.tableId;
        const roll = readRollValue(req.params.roll);
        const result = fumbleTableService.findFumbleResult(tableId, roll);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const readRollValue = (value) => {
    try {
        const roll = parseInt(value);
        if (!roll || roll < 1 || roll > 100) {
            throw { status: 400, message: 'Invalid roll range (1-100)' };
        }
        return roll;
    } catch (error) {
        throw { status: 400, message: 'Invalid roll range (1-100)' };
    }
};

module.exports = router;