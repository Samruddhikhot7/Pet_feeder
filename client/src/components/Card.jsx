import React from 'react';

const Card = ({ children, className = '', title, subtitle, icon: Icon, action }) => {
  return (
    <div className={`card ${className}`}>
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-slate-900 rounded-lg">
                <Icon className="w-5 h-5 text-blue-400" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-100">{title}</h2>
              {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
