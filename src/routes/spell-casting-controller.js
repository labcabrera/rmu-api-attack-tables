const express = require('express');
const spellCastingService = require('../services/spell-casting-service');

const modifiersRouter = express.Router();
const failureRouter = express.Router();

const sendError = (res, error) => res.status(error.status || 500).json({ error: error.message });

modifiersRouter.get('/modifiers', (req, res) => {
  try {
    res.json(spellCastingService.findModifiers());
  } catch (error) {
    sendError(res, error);
  }
});

failureRouter.get('/', (req, res) => {
  res.json(spellCastingService.REALMS);
});

failureRouter.get('/:realm/:type/:roll', (req, res) => {
  try {
    const roll = Number(req.params.roll);
    if (!Number.isInteger(roll)) {
      throw { status: 400, message: 'Invalid roll (integer expected)' };
    }
    res.json(spellCastingService.findSpellFailureResult(req.params.realm, req.params.type, roll));
  } catch (error) {
    sendError(res, error);
  }
});

module.exports = { modifiersRouter, failureRouter };
