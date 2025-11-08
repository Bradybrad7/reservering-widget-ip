import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineEdit } from '../../components/ui/InlineEdit';

describe('InlineEdit Component', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave.mockResolvedValue(true);
  });

  it('should render in view mode by default', () => {
    render(
      <InlineEdit 
        value="Test Value" 
        onSave={mockOnSave} 
      />
    );

    expect(screen.getByText('Test Value')).toBeInTheDocument();
  });

  it('should switch to edit mode on click', async () => {
    const user = userEvent.setup();
    
    render(
      <InlineEdit 
        value="Test Value" 
        onSave={mockOnSave} 
      />
    );

    // Click to edit - look for edit button or text
    const editButton = screen.getByRole('button');
    await user.click(editButton);

    // Should show input
    await waitFor(() => {
      const input = screen.queryByRole('textbox') || screen.queryByRole('spinbutton');
      expect(input).toBeInTheDocument();
    });
  });

  it('should save on check button click', async () => {
    const user = userEvent.setup();
    
    render(
      <InlineEdit 
        value="Original" 
        onSave={mockOnSave} 
      />
    );

    // Enter edit mode
    await user.click(screen.getByRole('button'));
    
    // Type new value
    const input = await screen.findByDisplayValue('Original');
    await user.clear(input);
    await user.type(input, 'Updated Value');

    // Click save button (check icon)
    const saveButton = screen.getByTitle('Opslaan');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('Updated Value');
    });
  });

  it('should cancel on X button click', async () => {
    const user = userEvent.setup();
    
    render(
      <InlineEdit 
        value="Original" 
        onSave={mockOnSave} 
      />
    );

    // Enter edit mode
    await user.click(screen.getByRole('button'));
    
    const input = await screen.findByDisplayValue('Original');
    await user.clear(input);
    await user.type(input, 'Updated Value');

    // Click cancel button
    const cancelButton = screen.getByTitle('Annuleren');
    await user.click(cancelButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('should show loading state during save', async () => {
    const user = userEvent.setup();
    mockOnSave.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(true), 100))
    );
    
    render(
      <InlineEdit 
        value="Original" 
        onSave={mockOnSave} 
      />
    );

    await user.click(screen.getByRole('button'));
    const input = await screen.findByDisplayValue('Original');
    await user.type(input, 'X');

    const saveButton = screen.getByTitle('Opslaan');
    await user.click(saveButton);

    // Button should be disabled during save
    expect(saveButton).toBeDisabled();
  });

  it('should handle save errors', async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValueOnce(false);
    
    render(
      <InlineEdit 
        value="Original" 
        onSave={mockOnSave} 
      />
    );

    await user.click(screen.getByRole('button'));
    const input = await screen.findByDisplayValue('Original');
    await user.type(input, 'X');

    const saveButton = screen.getByTitle('Opslaan');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('should support number type', async () => {
    const user = userEvent.setup();
    
    render(
      <InlineEdit 
        value={100} 
        onSave={mockOnSave}
        type="number"
      />
    );

    await user.click(screen.getByRole('button'));

    const input = await screen.findByDisplayValue('100');
    expect(input).toHaveAttribute('type', 'number');
  });
});
