import PropTypes from 'prop-types';
import clsx from 'clsx'; // Utility untuk menggabungkan classNames secara kondisional

function Button({ children, onClick, type = 'button', variant = 'primary', className = '', ...props }) {
  const baseStyles = 'py-2 px-4 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-sm hover:shadow-md',
    secondary: 'bg-emerald-300 text-emerald-900 hover:bg-emerald-200 focus:ring-emerald-300',
    outline: 'bg-transparent border border-emerald-500 text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-gray-800 hover:bg-gray-100 focus:ring-emerald-300',
  };

  const buttonClasses = clsx(
    baseStyles,
    variants[variant],
    className // Gabungkan dengan className tambahan dari props
  );

  return (
    <button
      type={type}
      onClick={onClick}
      className={buttonClasses}
      {...props} // Sebarkan props lainnya (misal: disabled)
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'danger', 'ghost']),
  className: PropTypes.string,
};

export default Button; 