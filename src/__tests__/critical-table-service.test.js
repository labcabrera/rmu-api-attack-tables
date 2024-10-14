const fs = require('fs');
const path = require('path');
const criticalTableService = require('../services/critical-table-service');

describe('CriticalTableService', () => {

    describe('findCriticalResult', () => {
        it('should return the critical result when found', () => {
            for (let i = 1; i <= 100; i++) {
                const result = criticalTableService.findCriticalResult('slash', 'a', i);
                expect(result).toHaveProperty('message');
            }
        });

        it('check slash a 56', () => {
            const result = criticalTableService.findCriticalResult('slash', 'a', 56);
            expect(result.dmg).toBe(14);
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