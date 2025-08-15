import React, { useEffect } from 'react';

interface ModalProps {
    onClose: () => void;
    children: React.ReactNode;
    size?: 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ onClose, children, size = 'md' }) => {
    // This effect handles the 'Escape' key to close the modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const sizeClasses = {
        md: 'max-w-lg',
        lg: 'max-w-4xl'
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-4" 
            onClick={onClose}
        >
            <div 
                className={`bg-gray-800 rounded-lg shadow-xl w-full border border-gray-700 flex flex-col ${sizeClasses[size]}`} 
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;