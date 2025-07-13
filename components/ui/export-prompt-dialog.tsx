import { Download, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ExportPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onDelete: () => void;
  itemName: string;
  itemType?: 'analysis' | 'project';
}

export function ExportPromptDialog({
  isOpen,
  onClose,
  onExport,
  onDelete,
  itemName,
  itemType = 'analysis'
}: ExportPromptDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export {itemType} before deleting?</DialogTitle>
          <DialogDescription>
            You're about to delete "{itemName}". Would you like to export your data first? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onExport();
              onDelete();
            }}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export & Delete
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Without Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}