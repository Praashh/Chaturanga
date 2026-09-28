import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

interface CustomModalHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const CustomModalHeader: React.FC<CustomModalHeaderProps> = ({
  icon,
  title,
  description,
}) => (
  <DialogHeader className="px-5 py-3.5 border-b border-[#262421] bg-[#161512] text-left">
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-[#262421] border border-[#3a352f] flex items-center justify-center text-sm shadow-inner">
        {icon}
      </div>
      <div>
        <DialogTitle className="text-sm font-semibold text-white tracking-wide">
          {title}
        </DialogTitle>
        <DialogDescription className="text-[11px] text-[#8a857d]">
          {description}
        </DialogDescription>
      </div>
    </div>
  </DialogHeader>
);
