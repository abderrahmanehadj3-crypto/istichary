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
  LucideProps,
} from 'lucide-react';

interface SpecializationIconProps extends LucideProps {
  iconName: string;
}

export const SpecializationIcon: React.FC<SpecializationIconProps> = ({ iconName, ...props }) => {
  switch (iconName) {
    case 'HeartPulse':
      return <HeartPulse {...props} />;
    case 'Baby':
      return <Baby {...props} />;
    case 'Brain':
      return <Brain {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'UserCheck':
      return <UserCheck {...props} />;
    case 'Activity':
      return <Activity {...props} />;
    case 'Smile':
      return <Smile {...props} />;
    case 'SmilePlus':
      return <SmilePlus {...props} />;
    case 'Stethoscope':
    default:
      return <Stethoscope {...props} />;
  }
};
