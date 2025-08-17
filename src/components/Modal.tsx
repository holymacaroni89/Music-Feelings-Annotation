import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
    onClose: () => void;
    children: React.ReactNode;
    size?: 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ onClose, children, size = 'md' }) => {
    const sizeClasses = {
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-4xl'
    } as const;

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className={cn('border-gray-700 bg-gray-800 text-gray-200', sizeClasses[size])}>
                {children}
            </DialogContent>
        </Dialog>
    );
};

export default Modal;
