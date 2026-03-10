import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";

interface NotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saleNotes: string;
  setSaleNotes: (notes: string) => void;
  saveNotes: () => void;
}

export default function NotesDialog({
  isOpen,
  onClose,
  saleNotes,
  setSaleNotes,
  saveNotes,
}: NotesDialogProps) {
  const { t } = useLanguage();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("checkout.saleNotesTitle")}</DialogTitle>
          <DialogDescription>
            {t("checkout.saleNotesDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sale-notes">{t("cart.notes")}</Label>
            <Textarea
              id="sale-notes"
              placeholder={t("checkout.notesPlaceholder")}
              value={saleNotes}
              onChange={(e) => setSaleNotes(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={saveNotes}>{t("checkout.saveNotesButton")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
