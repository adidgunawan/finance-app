import React from 'react';

interface HighlightTextProps {
    text: string;
    highlight: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, highlight }) => {
    if (!highlight) return <>{text}</>;

    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={index} className="bg-yellow-400 text-black">
                        {part}
                    </span>
                ) : (
                    <span key={index}>{part}</span>
                )
            )}
        </>
    );
};
