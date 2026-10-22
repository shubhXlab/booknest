import { forwardRef } from 'react';

const Button = forwardRef((props, ref) => {
  const { 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    disabled = false, 
    children, 
    type = 'button',
    ...rest 
  } = props;

  const variants = {
    primary: 'bg-primary text-white hover:bg-primaryHover',
    secondary: 'bg-secondary text-white hover:bg-secondaryHover',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'text-primary hover:bg-primary/10',
    danger: 'bg-semantic-error text-white hover:bg-errorDark',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };