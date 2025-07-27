const fs = require('fs');
const path = require('path');
const criticalTableService = require('../services/critical-table-service');

describe('Check critical table structure', () => {

    const validateEffect = (effect) => {
        expect(effect).toBeDefined();
        expect(effect).toHaveProperty('status');
        expect(typeof effect.status).toBe('string');
        
        switch (effect.status) {
            case 'bleeding':
                expect(effect.value).toBeDefined();
                expect(typeof effect.value).toBe('number');
                expect(effect.value).toBeGreaterThan(0);
                break;
            case 'penalty':
                expect(effect.value).toBeDefined();
                expect(typeof effect.value).toBe('number');
                expect(effect.value).toBeLessThan(0);
                break;
            case 'stunned':
                expect(effect.rounds).toBeDefined();
                break;
            case 'staggered':
                expect(effect.rounds || effect.value).toBeDefined();
                const staggeredRounds = effect.rounds || effect.value;
                expect(typeof staggeredRounds).toBe('number');
                expect(staggeredRounds).toBeGreaterThan(0);
                break;
            case 'knocked_down':
                expect(effect.rounds).toBeDefined();
                if (effect.rounds || effect.value) {
                    const knockedRounds = effect.rounds || effect.value;
                    expect(typeof knockedRounds).toBe('number');
                    expect(knockedRounds).toBeGreaterThan(0);
                }
                break;
            case 'breakage_roll':
                expect(effect.value).toBeDefined();
                expect(typeof effect.value).toBe('number');
                break;
            case 'fatigue':
                expect(effect.value).toBeDefined();
                expect(typeof effect.value).toBe('number');
                expect(effect.value).toBeGreaterThan(0);
                break;
            default:
                // Lanzar error para estados no reconocidos
                throw new Error(`Estado no reconocido en effects: ${effect.status}. Estados válidos: bleeding, penalty, stunned, staggered, knocked_down, breakage_roll, fatigue`);
        }
    };

    describe('findCriticalResult', () => {

        it('should return critical results for S-A table from 1 to 100', () => {
            for (let roll = 1; roll <= 100; roll++) {
                const result = criticalTableService.findCriticalResult('S', 'A', roll);
                expect(result).toBeDefined();
                expect(result).toHaveProperty('rollMin');
                expect(result).toHaveProperty('rollMax');
                expect(result).toHaveProperty('dmg');
                expect(result).toHaveProperty('location');
                expect(result).toHaveProperty('message');

                // Validar effects si existe
                if (result.effects) {
                    expect(Array.isArray(result.effects)).toBe(true);
                    result.effects.forEach(effect => {
                        validateEffect(effect);
                    });
                }
            }
        });
    });

    describe('getFilePath', () => {
        it('should throw an error when the file does not exist', () => {
            expect(() => criticalTableService.findCriticalResult('error', 'a', 10)).toThrow({
                status: 404,
                message: 'Critical table file not found'
            });
        });
    });
});