/**
 * @Requirement REQ-025
 */
import { AlertCircle } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type TodoDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  todoTitle: string
  onConfirm: () => Promise<void>
}

export function TodoDeleteDialog({
  open,
  onOpenChange,
  todoTitle,
  onConfirm,
}: TodoDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>‘{todoTitle}’ 할 일을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            삭제한 할 일은 목록에서 사라지며 이 동작은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <DeleteConfirmBody
          onConfirm={onConfirm}
          onConfirmed={() => onOpenChange(false)}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DeleteConfirmBody({
  onConfirm,
  onConfirmed,
}: {
  onConfirm: () => Promise<void>
  onConfirmed: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (submitting) return
    setSubmitting(true)
    setFormError(null)
    try {
      await onConfirm()
      setSubmitting(false)
      onConfirmed()
    } catch {
      setFormError("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      setSubmitting(false)
    }
  }

  return (
    <>
      {formError && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <AlertDialogFooter>
        <AlertDialogClose
          render={<Button type="button" variant="outline" />}
          disabled={submitting}
        >
          취소
        </AlertDialogClose>
        <Button
          type="button"
          variant="destructive"
          onClick={handleConfirm}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? "삭제 중..." : "삭제"}
        </Button>
      </AlertDialogFooter>
    </>
  )
}

export default TodoDeleteDialog
