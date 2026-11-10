import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './ui/Button';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    tone?: 'primary' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}

/** A yes/no question in a modal. Use it before anything destructive. */
export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Cancel',
    tone = 'primary',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Modal open={open} title={title} onClose={onCancel}>
            <p className="text-sm text-neutral-300">{description}</p>
            <div className="flex justify-end gap-3 pt-2">
                <Button onClick={onCancel}>{cancelLabel}</Button>
                <Button variant={tone} onClick={onConfirm}>
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
