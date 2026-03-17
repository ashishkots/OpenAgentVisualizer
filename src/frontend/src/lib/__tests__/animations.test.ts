import { pageEnter, pageLeave } from '../transitions';
import { emitXPGain } from '../particles';

describe('animation helpers', () => {
  it('pageEnter is a function', () => {
    expect(typeof pageEnter).toBe('function');
  });
  it('emitXPGain is a function', () => {
    expect(typeof emitXPGain).toBe('function');
  });
});
