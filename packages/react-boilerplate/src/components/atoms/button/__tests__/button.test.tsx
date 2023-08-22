import React from 'react';
import { render, screen } from '@testing-library/react';
import { button } from '../';

test('renders component successfully', () => {
  render(<button  />);
  const element = screen.getByTestId(/test/i);
  expect(element).toBeInTheDocument();
});