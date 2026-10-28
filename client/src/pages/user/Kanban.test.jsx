import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import UserKanbanPage from './Kanban';
import { apiRequest } from '../../shared/api';

jest.mock('../../shared/auth', () => ({ useAuth: () => ({ tokens: { user: 'test-token' } }) }));
jest.mock('../../shared/api', () => ({ apiRequest: jest.fn() }));
const makeChat = (index, chat_status = 'open') => ({
  chat_id: `chat-${index}`,
  sender_name: `Customer ${index}`,
  sender_mobile: `+9190000000${index}`,
  chat_status,
  origin: 'meta',
});
beforeEach(() => {
  apiRequest.mockReset();
  apiRequest.mockImplementation(async (path) =>
    path.endsWith('get_chats')
      ? {
          success: true,
          data: [
            ...Array.from({ length: 11 }, (_, i) => makeChat(i + 1)),
            makeChat(12, 'pending'),
            makeChat(13, 'solved'),
          ],
        }
      : { success: true },
  );
});

test('paginates each stage independently and changing page size resets pages', async () => {
  render(<UserKanbanPage />);
  const open = screen.getByRole('region', { name: 'Open tickets' });
  const pending = screen.getByRole('region', { name: 'Pending tickets' });
  await within(open).findByText('Customer 1');
  expect(within(open).getAllByRole('article')).toHaveLength(5);
  expect(within(open).queryByText('Customer 6')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Open next page' }));
  expect(within(open).getByText('Customer 6')).toBeInTheDocument();
  expect(within(pending).getByText('Customer 12')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Pending next page' })).toBeDisabled();
  fireEvent.change(screen.getByRole('combobox', { name: 'Tickets per stage' }), {
    target: { value: '10' },
  });
  expect(within(open).getByText('Customer 1')).toBeInTheDocument();
  expect(within(open).getAllByRole('article')).toHaveLength(10);
  expect(screen.getByRole('button', { name: 'Open previous page' })).toBeDisabled();
});

test('moving the last ticket clamps an emptied final page and keeps the complete order', async () => {
  render(<UserKanbanPage />);
  await screen.findByText('Customer 1');
  fireEvent.click(screen.getByRole('button', { name: 'Open next page' }));
  fireEvent.click(screen.getByRole('button', { name: 'Open next page' }));
  fireEvent.click(screen.getByRole('button', { name: 'Move Customer 11 to Solved' }));
  await waitFor(() =>
    expect(apiRequest).toHaveBeenCalledWith('/api/inbox/update_kanban_order', expect.any(Object)),
  );
  const open = screen.getByRole('region', { name: 'Open tickets' });
  expect(within(open).getByText('Customer 6')).toBeInTheDocument();
  expect(within(open).getByText(/Page 2 of 2/)).toBeInTheDocument();
  expect(
    within(screen.getByRole('region', { name: 'Solved tickets' })).getByText('Customer 11'),
  ).toBeInTheDocument();
  const orderCall = apiRequest.mock.calls.find(([path]) => path.endsWith('update_kanban_order'));
  expect(orderCall[1].body.orderedChatIds).toHaveLength(13);
});

test('a failed refresh preserves previously loaded tickets', async () => {
  render(<UserKanbanPage />);
  await screen.findByText('Customer 1');
  apiRequest.mockRejectedValueOnce(new Error('Backend unavailable'));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh', exact: true }));
  await screen.findByText('Backend unavailable');
  expect(screen.getByText('Customer 1')).toBeInTheDocument();
  expect(screen.getByText('Customer 12')).toBeInTheDocument();
});
