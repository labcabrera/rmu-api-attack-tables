const express = require('express');
const router = express.Router();
const attackTableService = require("../services/attack-table-service");

const tables = [
    "arming-sword",
    "ball-cold",
    "ball-fire",
    "ball-lightning",
    "battle-axe",
    "beak",
    "bite",
    "bola",
    "bolt-fire",
    "bolt-ice",
    "bolt-lightning",
    "bolt-water",
    "bow-long",
    "bow-short",
    "broadsword",
    "claw",
    "club",
    "crossbow",
    "crush",
    "dagger",
    "falchion",
    "fighting-stick",
    "flail",
    "grapple",
    "horn",
    "mace",
    "ram",
    "rapier",
    "rock",
    "scimitar",
    "shield",
    "sling",
    "spear",
    "stinger",
    "trample",
    "unarmed-strikes",
    "unarmed-sweeps",
    "war-hammer",
    "whip"
];

router.get('/', (req, res) => {
    res.json(tables);
});

router.get('/:tableId/:size/:armorType/:roll', async (req, res) => {
    try {
        const tableId = req.params.tableId;
        const size = req.params.size;
        const armorType = readArmorType(req.params.armorType);
        const roll = readRollValue(req.params.roll);
        const result = await attackTableService.findAttackResult(tableId, size, armorType, roll);
        const body = buildResponseBody(result);
        res.json(body);
    } catch (error) {
        const status = error.status || 500;
        res.status(status).json({ error: error.message });
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

const buildResponseBody = (result) => {
    if (result.trim() !== "" && !isNaN(result)) {
        return {
            literal: result,
            damage: parseInt(result),
            criticalType: null,
            criticalSeverity: null,
        };
    }
    return {
        literal: result,
        damage: parseInt(result.slice(0, -2)),
        criticalType: result.charAt(result.length - 1),
        criticalSeverity: result.charAt(result.length - 2),
    };
};

module.exports = router;