import { describe, it, expect } from 'vitest';
import { SESSION_CONFIG } from '../../config/sessionConfig'; // Update the path as needed

describe('SESSION_CONFIG', () => {
  it('should have the correct timeout value', () => {
    expect(SESSION_CONFIG.timeoutMinutes).toBe(6000);
  });

  it('should have the correct warning seconds value', () => {
    expect(SESSION_CONFIG.warningSeconds).toBe(6000);
  });

  it('should have the correct check interval seconds value', () => {
    expect(SESSION_CONFIG.checkIntervalSeconds).toBe(5);
  });

  it('should have all required configuration properties', () => {
    expect(SESSION_CONFIG).toHaveProperty('timeoutMinutes');
    expect(SESSION_CONFIG).toHaveProperty('warningSeconds');
    expect(SESSION_CONFIG).toHaveProperty('checkIntervalSeconds');
  });

  it('should have numeric values for all properties', () => {
    expect(typeof SESSION_CONFIG.timeoutMinutes).toBe('number');
    expect(typeof SESSION_CONFIG.warningSeconds).toBe('number');
    expect(typeof SESSION_CONFIG.checkIntervalSeconds).toBe('number');
  });

  it('should have positive values for all time properties', () => {
    expect(SESSION_CONFIG.timeoutMinutes).toBeGreaterThan(0);
    expect(SESSION_CONFIG.warningSeconds).toBeGreaterThan(0);
    expect(SESSION_CONFIG.checkIntervalSeconds).toBeGreaterThan(0);
  });

  it('should have warning time less than or equal to timeout time', () => {
    const timeoutInSeconds = SESSION_CONFIG.timeoutMinutes * 60;
    expect(SESSION_CONFIG.warningSeconds).toBeLessThanOrEqual(timeoutInSeconds);
  });
});