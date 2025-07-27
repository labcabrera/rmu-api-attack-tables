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
                expect(effect.value).toBeDefined();
                break;
            case 'staggered':
                expect(effect.rounds).toBeDefined();
                expect(effect.value).toBeDefined();
                const staggeredRounds = effect.rounds || effect.value;
                expect(typeof staggeredRounds).toBe('number');
                expect(staggeredRounds).toBeGreaterThan(0);
                break;
            case 'prone':
                expect(effect.rounds).toBeDefined();
                break;
            case 'breakage_roll':
                expect(effect.value).toBeDefined();
                expect(typeof effect.value).toBe('number');
                break;
            case 'fatigue':
                expect(effect.value).toBeDefined();
                expect(typeof effect.value).toBe('number');
                expect(effect.value).toBeLessThan(0);
                break;
            case 'dying':
                expect(effect.rounds).toBeDefined();
                break;
            case 'slow_percent':
                expect(effect.value).toBeDefined();
                expect(effect.value).toBeGreaterThan(0);
            default:
                throw new Error(`Estado no reconocido en effects: ${effect.status}. Estados válidos: bleeding, penalty, stunned, staggered, knocked_down, breakage_roll, fatigue`);
        }
    };

    const validateTable = (type, severity) => {
        for (let roll = 1; roll <= 100; roll++) {
                const result = criticalTableService.findCriticalResult(type, severity, roll);
                expect(result).toBeDefined();
                expect(result).toHaveProperty('rollMin');
                expect(result).toHaveProperty('rollMax');
                expect(result).toHaveProperty('dmg');
                expect(result).toHaveProperty('location');
                expect(result).toHaveProperty('message');
                if (result.effects) {
                    expect(Array.isArray(result.effects)).toBe(true);
                    result.effects.forEach(effect => {
                        validateEffect(effect);
                    });
                }
            }
    };

    describe('findCriticalResult', () => {

        it('should return critical results for S-A table from 1 to 100', () => {
            validateTable('S', 'A');
        });

        it('should return critical results for S-B table from 1 to 100', () => {
            validateTable('S', 'B');
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