import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';

interface TelegramToastProps {
  senderName: string;
  senderAvatar?: string;
  senderInitials: string;
  message: string;
  onClose: () => void;
  onClick?: () => void;
}

export function TelegramToast({
  senderName,
  senderAvatar,
  senderInitials,
  message,
  onClose,
  onClick
}: TelegramToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    onClose();
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[100] max-w-sm w-full transition-all duration-300 ease-out cursor-pointer ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      onClick={handleClick}
    >
      <div className="backdrop-blur-xl bg-background/80 border border-border/50 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/20">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {senderInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{senderName}</p>
          <p className="text-sm text-muted-foreground line-clamp-2 break-words">
            {message}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
