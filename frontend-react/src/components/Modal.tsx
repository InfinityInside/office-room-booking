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
            dialog.querySelector<HTMLElement>('input, select, textarea')?.focus();
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
            className={
                'm-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto '  +
                'rounded-2xl border border-border-strong bg-surface text-neutral-100 ' +
                'shadow-2xl shadow-black/60 ' +
                'backdrop:bg-black/70 backdrop:backdrop-blur-sm'
            }
        >
            <div className="flex flex-col gap-5 p-6">
                <div className="flex items-start justify-between gap-4">
                    <h2 id={titleId} className="text-xl font-semibold tracking-tight">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="-m-1 rounded-lg p-1 text-muted transition-colors hover:bg-neutral-800 hover:text-neutral-100"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            aria-hidden="true"
                        >
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </dialog>
    );
}
