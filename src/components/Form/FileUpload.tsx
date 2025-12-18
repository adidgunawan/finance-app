import * as React from 'react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label?: string;
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  error?: string;
  description?: string;
  required?: boolean;
}

export function FileUpload({ label, value, onChange, accept, multiple = true, error, description, required }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (multiple) {
      onChange([...value, ...files]);
    } else {
      onChange(files);
    }
    // Clear the input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <FormField label={label} error={error} description={description} required={required}>
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          className={cn('h-10', error && 'border-destructive')}
        >
          Choose Files
        </Button>
        {value.length > 0 && (
          <div className="space-y-2">
            {value.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border bg-secondary/50 px-3 py-2"
              >
                <span className="text-sm truncate flex-1">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0 ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </FormField>
  );
}
