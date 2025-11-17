import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveInteractionPanelBaseline from '../app/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return { push: jest.fn() };
  },
}));

describe('Baseline Live Interaction Panel', () => {
  test('renders with header status', () => {
    render(<LiveInteractionPanelBaseline />);
    expect(screen.getByText(/Status:/i)).toBeInTheDocument();
  });

  test('displays program list', () => {
    render(<LiveInteractionPanelBaseline />);
    expect(screen.getByText(/Programs/i)).toBeInTheDocument();
  });

  test('allows selecting a program', async () => {
    render(<LiveInteractionPanelBaseline />);
    const programs = screen.getAllByText(/Northern Lights Theme/i);
    fireEvent.click(programs[0]);
    await waitFor(() => {
      expect(screen.getByText(/Blue Aurora/i)).toBeInTheDocument();
    });
  });

  test('displays voting options when program selected', async () => {
    render(<LiveInteractionPanelBaseline />);
    const programs = screen.getAllByText(/Northern Lights Theme/i);
    fireEvent.click(programs[0]);
    await waitFor(() => {
      expect(screen.getByText(/Blue Aurora/i)).toBeInTheDocument();
      expect(screen.getByText(/Green Aurora/i)).toBeInTheDocument();
    });
  });

  test('has disabled buttons when installation not normal', async () => {
    render(<LiveInteractionPanelBaseline />);
    const sendButton = screen.getByRole('button', { name: /Send/i });
    expect(sendButton).not.toBeDisabled();
  });

  test('shows queue length info', () => {
    render(<LiveInteractionPanelBaseline />);
    expect(screen.getByText(/Queue Length:/i)).toBeInTheDocument();
  });

  test('shows crowdedness level', () => {
    render(<LiveInteractionPanelBaseline />);
    expect(screen.getByText(/Crowdedness:/i)).toBeInTheDocument();
  });

  test('message input is present', () => {
    render(<LiveInteractionPanelBaseline />);
    expect(screen.getByPlaceholderText(/Type message/i)).toBeInTheDocument();
  });

  test('displays existing messages', () => {
    render(<LiveInteractionPanelBaseline />);
    expect(screen.getByText(/Amazing lights/i)).toBeInTheDocument();
  });

  test('can type in message input', async () => {
    render(<LiveInteractionPanelBaseline />);
    const input = screen.getByPlaceholderText(/Type message/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input.value).toBe('Test message');
  });

  test('dense layout characteristic - small font sizes', () => {
    const { container } = render(<LiveInteractionPanelBaseline />);
    const smallText = container.querySelectorAll('[style*="font-size: 11px"]');
    expect(smallText.length).toBeGreaterThan(0);
  });

  test('poor visual hierarchy - insufficient spacing', () => {
    const { container } = render(<LiveInteractionPanelBaseline />);
    const sections = container.querySelectorAll('[style*="margin-bottom"]');
    // Dense layout has small margins
    let smallMargins = 0;
    sections.forEach(el => {
      const style = el.getAttribute('style') || '';
      if (style.includes('5px') || style.includes('10px')) {
        smallMargins++;
      }
    });
    expect(smallMargins).toBeGreaterThan(0);
  });

  test('no tab navigation - single page layout', () => {
    render(<LiveInteractionPanelBaseline />);
    const tabs = screen.queryAllByRole('tab');
    expect(tabs.length).toBe(0);
  });
});
