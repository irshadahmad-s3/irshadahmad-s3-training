import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, type MemoryRouterProps } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage';

const { login, register } = vi.hoisted(() => ({ login: vi.fn(), register: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ login, register, error: '' }) }));

function Destination() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}
function renderPage(mode: 'login' | 'register', initialEntries: MemoryRouterProps['initialEntries'] = [`/${mode}`]) {
  return render(<MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AuthPage mode={mode} /><Destination /></MemoryRouter>);
}

describe('authentication form', () => {
  beforeEach(() => { login.mockReset(); register.mockReset(); });

  it('requires a valid email and password before submitting', async () => {
    const user = userEvent.setup();
    renderPage('login');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(login).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Email'), 'person@example.test');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('person@example.test', 'password'));
  });

  it('enforces registration password length and displays the registration flow', async () => {
    const user = userEvent.setup();
    renderPage('register');
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await user.type(screen.getByLabelText('Email'), 'person@example.test');
    await user.type(screen.getByLabelText('Password'), 'short');
    expect(screen.getByLabelText('Password')).toHaveAttribute('minlength', '12');
    await user.clear(screen.getByLabelText('Password'));
    await user.type(screen.getByLabelText('Password'), 'long-enough-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(register).toHaveBeenCalledWith('person@example.test', 'long-enough-password'));
  });

  it('navigates to the originally requested page after successful login', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue(undefined);
    renderPage('login', [{ pathname: '/login', state: { from: { pathname: '/tasks/5' } } }]);
    await user.type(screen.getByLabelText('Email'), 'person@example.test');
    await user.type(screen.getByLabelText('Password'), 'password');
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);
    await waitFor(() => expect(screen.getByLabelText('Current path')).toHaveTextContent('/tasks/5'));
  });

  it('keeps the user on the sign in page after a failed login', async () => {
    const user = userEvent.setup();
    login.mockRejectedValue(new Error('Invalid email or password'));
    renderPage('login');
    await user.type(screen.getByLabelText('Email'), 'person@example.test');
    await user.type(screen.getByLabelText('Password'), 'incorrect-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByLabelText('Current path')).toHaveTextContent('/login'));
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });
});
