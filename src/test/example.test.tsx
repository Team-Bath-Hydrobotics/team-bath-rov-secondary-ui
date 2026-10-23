import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

const Practice = () => (
  <>
    <h1>Hi ROV</h1>
    <p>this is a practice test</p>
  </>
);

describe('test setup', () => {
  it('renders heading and para', () => {
    render(<Practice />);
    expect(screen.getByRole('heading', { name: 'Hi ROV' })).toBeInTheDocument();
    expect(screen.getByText('this is a practice test')).toBeInTheDocument();
  });
});
