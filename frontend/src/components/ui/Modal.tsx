import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-text-primary/45 backdrop-blur-xs"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-md z-10"
          >
            <Card className="shadow-[0_8px_32px_-4px_rgba(0,0,0,0.08)] border border-border overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border bg-white">
                {title ? (
                  <h2 className="text-base font-bold text-text-primary tracking-tight">{title}</h2>
                ) : (
                  <div />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-gray-100"
                >
                  <X size={16} />
                </Button>
              </div>
              <div className="p-6 bg-white">{children}</div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
