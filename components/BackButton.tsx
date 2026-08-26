import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  fallbackTo: string;
  label?: string;
  className?: string;
  iconClassName?: string;
}

interface RouterHistoryState {
  idx?: unknown;
}

const canNavigateBackWithinApp = (): boolean => {
  const state = window.history.state as RouterHistoryState | null;
  return typeof state?.idx === 'number' && state.idx > 0;
};

const BackButton: React.FC<BackButtonProps> = ({
  fallbackTo,
  label = '返回上一頁',
  className = '',
  iconClassName = 'mr-2 h-4 w-4',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (canNavigateBackWithinApp()) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo);
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      <ArrowLeft className={iconClassName} aria-hidden="true" />
      {label}
    </button>
  );
};

export default BackButton;
