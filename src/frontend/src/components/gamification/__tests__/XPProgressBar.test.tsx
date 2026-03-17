import { render } from '@testing-library/react';
import { XPProgressBar } from '../XPProgressBar';
describe('XPProgressBar', () => {
  it('renders for all xp levels', () => {
    [0,1000,3000,7500,15000].forEach(xp => {
      const { unmount } = render(<XPProgressBar xpTotal={xp} />);
      unmount();
    });
  });
});
