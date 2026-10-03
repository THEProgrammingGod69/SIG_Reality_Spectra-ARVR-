'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/admin/ui/alert-dialog';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

type ConfirmDeleteProps = {
  /** The button's text, e.g. "Delete event". */
  label: string;
  /** The question, e.g. "Delete this event?". */
  title: string;
  /** What deleting does, and that it cannot be undone. */
  description: string;
  onConfirm: () => void | Promise<void>;
  size?: 'sm' | 'default';
  disabled?: boolean;
  className?: string;
};

/**
 * The one way the admin panel deletes something: a quiet destructive button
 * that asks first, in words that say what is lost. Every delete goes through
 * it, so they all look and behave the same.
 */
export function ConfirmDelete({
  label,
  title,
  description,
  onConfirm,
  size = 'default',
  disabled = false,
  className,
}: ConfirmDeleteProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size}
        disabled={disabled}
        className={cn('text-destructive hover:text-destructive', className)}
        onClick={() => setOpen(true)}
      >
        <Icon icon={Trash2} size="sm" />
        {label}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction destructive onClick={() => void onConfirm()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
