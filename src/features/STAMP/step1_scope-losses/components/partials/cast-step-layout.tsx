import React from 'react';

interface CastStepLayoutProps {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

const CastStepLayout: React.FC<CastStepLayoutProps> = ({ title, description, children }) => {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-md mt-2 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
};

export default CastStepLayout;
