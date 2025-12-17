import { useState, KeyboardEvent } from 'react';
import { Input as ShadcnInput } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
  description?: string;
  required?: boolean;
}

export function TagInput({ label, value, onChange, placeholder = 'Add tags...', error, description, required }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <FormField label={label} error={error} description={description} required={required}>
      <div className={cn(
        "flex flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 min-h-[2.5rem] items-center transition-colors",
        error && 'border-destructive focus-within:ring-2 focus-within:ring-destructive focus-within:ring-offset-2',
        !error && 'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
      )}>
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              onMouseDown={(e) => e.preventDefault()}
              className="ml-1 rounded-full hover:bg-secondary-foreground/20 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <ShadcnInput
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[100px] h-auto p-0 bg-transparent"
        />
      </div>
    </FormField>
  );
}
