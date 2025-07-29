const fs = require('fs');
const path = require('path');
const fumbleTableService = require('../services/fumble-table-service');

describe('Check fumble table structure', () => {

    const validateEffect = (effect) => {
        expect(effect).toBeDefined();
        expect(effect).toHaveProperty('status');
        expect(typeof effect.status).toBe('string');
        
        switch (effect.status) {
            case 'disarmed':
                break;
            case 'fatigue':
                expect(effect.value).toBeDefined();
                break;
            case 'initiative_penalty':
                expect(effect.rounds).toBeDefined();
                expect(effect.value).toBeDefined();
                break;
            case 'stunned':
                expect(effect.rounds).toBeDefined();
                expect(effect.value).toBeDefined();
                break;
            case 'breakage_roll':
                expect(effect.value).toBeDefined();
                break;
            case 'attack_penalty':
                expect(effect.rounds).toBeDefined();
                expect(effect.value).toBeDefined();
                break;
            case 'cannot_attack':
                expect(effect.rounds).toBeDefined();
                break;
            case 'cannot_parry':
                expect(effect.rounds).toBeDefined();
                break;
            default:
                throw new Error(`Invalid status effect: ${effect.status}.`);
        }
    };

    const validateTable = (tableId) => {
        for (let roll = 1; roll <= 100; roll++) {
                const result = fumbleTableService.findFumbleResult(tableId, roll);
                expect(result).toBeDefined();
                expect(result).toHaveProperty('rollMin');
                expect(result).toHaveProperty('rollMax');
                expect(result).toHaveProperty('text');
                if (result.effects) {
                    expect(Array.isArray(result.effects)).toBe(true);
                    result.effects.forEach(effect => {
                        validateEffect(effect);
                    });
                }
            }
    };

    describe('findFumbleResult', () => {

        it('valid melee-one-hand table', () => {
            validateTable('melee-one-hand');
        });

    
    });

});