import { forwardRef } from 'react';

const Input = forwardRef((props, ref) => {
  const { className = '', type = 'text', ...rest } = props;
  return (
    <input
      ref={ref}
      type={type}
      className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${className}`}
      {...rest}
    />
  );
});

Input.displayName = 'Input';

export { Input };