const express = require('express');
const router = express.Router();

router.get('/:tableId/:armorId/:value', async (req, res) => {
    const tableId = req.params.tableId;
    const armorId = req.params.armorId;
    const value = req.params.value;
    res.json("{}");
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const item = skills.find(item => item.id === id);
    if (item) {
        res.json(item);
    } else {
        res.status(404).json({ message: 'Skill not found' });
    }
});

module.exports = router;