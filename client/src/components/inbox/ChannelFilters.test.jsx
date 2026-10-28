import { fireEvent, render, screen } from '@testing-library/react';
import ChannelFilters from './ChannelFilters';
import { formatRelativeTimestamp, formatChatTimestamp, toMessageDate } from '../../shared/format';

test('channel buttons support arrow/Home/End navigation and announce selection', () => {
  const onChange = jest.fn();
  const { rerender } = render(<ChannelFilters value="all" onChange={onChange} />);
  const all = screen.getByRole('button', { name: 'All' });
  expect(all).toHaveAttribute('aria-pressed', 'true');
  fireEvent.keyDown(all, { key: 'End' });
  expect(screen.getByRole('button', { name: 'Website' })).toHaveFocus();
  expect(onChange).toHaveBeenLastCalledWith('website');
  fireEvent.keyDown(document.activeElement, { key: 'ArrowLeft' });
  expect(onChange).toHaveBeenLastCalledWith('instagram');
  rerender(<ChannelFilters value="instagram" onChange={onChange} />);
  expect(screen.getByRole('button', { name: 'Instagram' })).toHaveAttribute('aria-pressed', 'true');
});

test('a vertical mouse wheel scrolls an overflowing channel strip', () => {
  render(<ChannelFilters value="all" onChange={() => {}} />);
  const group = screen.getByRole('group', { name: 'Channel filter' });
  Object.defineProperties(group, { scrollWidth: { value: 390 }, clientWidth: { value: 260 } });
  fireEvent.wheel(group, { deltaY: 60 });
  expect(group.scrollLeft).toBe(60);
});

test('chat dates normalize seconds, milliseconds and ISO values without far-future years', () => {
  const seconds = 1783246570;
  expect(formatRelativeTimestamp(seconds)).toBe(formatRelativeTimestamp(seconds * 1000));
  expect(toMessageDate(seconds).getFullYear()).toBe(2026);
  expect(toMessageDate('2026-07-05T10:16:10Z').getFullYear()).toBe(2026);
  expect(formatChatTimestamp(seconds)).not.toContain('58478');
});
