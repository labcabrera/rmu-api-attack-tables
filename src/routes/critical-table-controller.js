const express = require('express');
const router = express.Router();
const criticalTableService = require("../services/critical-table-service");

router.get('/:tableId/:type/:roll', (req, res) => {
    try {
        const tableId = req.params.tableId;
        const type = req.params.type;
        const roll = readRollValue(req.params.roll);
        const result = criticalTableService.findCriticalResult(tableId, type, roll);
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