import React, { useRef } from 'react';

interface FileUploadProps {
  label?: string;
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export function FileUpload({ label, value, onChange, accept, multiple = true }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (multiple) {
      onChange([...value, ...files]);
    } else {
      onChange(files);
    }
  };

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Choose Files
        </button>
        {value.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            {value.map((file, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 8px',
                  marginTop: '4px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '3px',
                }}
              >
                <span style={{ fontSize: '13px' }}>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  style={{ fontSize: '12px', padding: '2px 6px' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

