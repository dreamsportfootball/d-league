import React from 'react';
import { Check } from 'lucide-react';
import type { ActionFeedbackStatus } from '../hooks/useActionFeedback';

interface ActionFeedbackLabelProps {
  status: ActionFeedbackStatus;
  icon: React.ReactNode;
  idleText: string;
  copiedText: string;
  sharedText?: string;
  failedText: string;
}

const ActionFeedbackLabel: React.FC<ActionFeedbackLabelProps> = ({
  status, icon, idleText, copiedText, sharedText = '已分享', failedText,
}) => {
  const success = status === 'COPIED' || status === 'SHARED';
  const label = status === 'COPIED'
    ? copiedText
    : status === 'SHARED'
      ? sharedText
      : status === 'FAILED'
        ? failedText
        : idleText;

  return (
    <span className="inline-flex items-center gap-2" aria-live="polite" aria-atomic="true">
      {success ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : icon}
      <span>{label}</span>
    </span>
  );
};

export default ActionFeedbackLabel;
