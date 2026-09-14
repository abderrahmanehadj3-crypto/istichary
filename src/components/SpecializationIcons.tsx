import React from 'react';
import {
  Stethoscope,
  HeartPulse,
  Baby,
  Brain,
  Sparkles,
  UserCheck,
  Activity,
  Smile,
  SmilePlus,
  FlaskConical,
  LucideProps,
} from 'lucide-react';

interface SpecializationIconProps extends LucideProps {
  iconName: string;
}

export const SpecializationIcon: React.FC<SpecializationIconProps> = ({ iconName, ...props }) => {
  switch (iconName) {
    case 'HeartPulse':
    case 'cardiology':
      return <HeartPulse {...props} />;
    case 'Baby':
    case 'pediatrics':
      return <Baby {...props} />;
    case 'Brain':
    case 'neurology':
      return <Brain {...props} />;
    case 'Sparkles':
    case 'dermatology':
      return <Sparkles {...props} />;
    case 'UserCheck':
      return <UserCheck {...props} />;
    case 'Activity':
    case 'psychiatry':
      return <Activity {...props} />;
    case 'Smile':
    case 'dentistry':
      return <Smile {...props} />;
    case 'SmilePlus':
      return <SmilePlus {...props} />;
    case 'FlaskConical':
    case 'laboratory':
      return <FlaskConical {...props} />;
    case 'Stethoscope':
    default:
      return <Stethoscope {...props} />;
  }
};
