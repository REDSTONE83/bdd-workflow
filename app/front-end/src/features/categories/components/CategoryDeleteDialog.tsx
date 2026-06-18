/**
 * @Requirement REQ-019
 *
 * 카테고리 삭제 확인 대화상자. 삭제 확인 안내와 함께 묶였던 할 일이 미분류로 바뀐다는 설명을 보여주고,
 * 확인 대기(submitting) 동안 확인 버튼을 비활성화한다. 영향받는 할 일 개수는 표시하지 않는다
 * (카테고리 조회 응답에 건수가 없다). 외부 삭제 호출은 onConfirm 콜백으로만 받는다.
 *
 * submitting/오류 상태는 내부 DeleteConfirmBody 에 두고, 대화상자가 열릴 때 새로 마운트해 리셋한다.
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

type CategoryDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryName: string
  onConfirm: () => Promise<void>
}

export function CategoryDeleteDialog({
  open,
  onOpenChange,
  categoryName,
  onConfirm,
}: CategoryDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            ‘{categoryName}’ 카테고리를 삭제할까요?
          </AlertDialogTitle>
          <AlertDialogDescription>
            이 카테고리에 묶였던 할 일은 미분류로 바뀝니다. 이 동작은 되돌릴 수
            없습니다.
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
    if (submitting) return // 응답 대기 중 중복 제출 차단
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

export default CategoryDeleteDialog
