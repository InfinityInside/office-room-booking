import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ModalProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
}

/**
 * A modal dialog built on the native <dialog> element.
 * The browser handles the backdrop, focus, the inert page behind it, and closing on Escape.
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    // Keep the real <dialog> in sync with the `open` prop.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }
        if (open && !dialog.open) {
            dialog.showModal();
        }
        if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={(e) => {
                // A click on the backdrop targets the <dialog> itself, not anything inside it.
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            style={{ padding: 0 }}
        >
            <div style={{ padding: '1rem' }}>
                <h2 id={titleId}>{title}</h2>
                {children}
            </div>
        </dialog>
    );
}
