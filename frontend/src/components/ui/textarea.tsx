import React from 'react';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`flex min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-vertical ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
