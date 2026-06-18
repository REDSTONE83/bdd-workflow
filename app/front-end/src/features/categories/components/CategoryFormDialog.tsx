/**
 * @Requirement REQ-017, REQ-018
 *
 * 카테고리 생성/수정 입력 대화상자. 이름·색상·설명 입력, 클라이언트 검증 안내,
 * 제출 중(submitting) 비활성, 서버 중복 이름 거절 안내, 성공 시 닫힘 상태를 가진다.
 * 외부 API 호출은 onSubmit 콜백으로만 받는다(Skeleton 단계). 구현 단계에서
 * onSubmit 을 카테고리 생성/수정 API + TanStack Query mutation 으로 연결한다.
 *
 * 폼 입력 상태는 내부 CategoryForm 에 두고, 대화상자가 열릴 때 Base UI 가 본문을 새로 마운트해
 * 초기값으로 리셋한다(useEffect 동기화 없음).
 */
import { AlertCircle } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  CATEGORY_COLOR_PATTERN,
  CATEGORY_COLOR_PRESETS,
  CATEGORY_DESCRIPTION_MAX,
  CATEGORY_NAME_MAX,
  type CategoryInput,
  DuplicateCategoryNameError,
} from "../types"

type FieldErrors = {
  name?: string
  color?: string
  description?: string
}

type CategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialValue?: CategoryInput
  onSubmit: (input: CategoryInput) => Promise<void>
}

const EMPTY: CategoryInput = { name: "", color: null, description: null }

export function CategoryFormDialog({
  open,
  onOpenChange,
  mode,
  initialValue,
  onSubmit,
}: CategoryFormDialogProps) {
  const base = initialValue ?? EMPTY
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "새 카테고리" : "카테고리 수정"}</DialogTitle>
          <DialogDescription>
            이름은 필수이고 색상과 설명은 비울 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          mode={mode}
          base={base}
          onSubmit={onSubmit}
          onSubmitted={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function CategoryForm({
  mode,
  base,
  onSubmit,
  onSubmitted,
}: {
  mode: "create" | "edit"
  base: CategoryInput
  onSubmit: (input: CategoryInput) => Promise<void>
  onSubmitted: () => void
}) {
  const [name, setName] = useState(base.name)
  const [color, setColor] = useState(base.color ?? "")
  const [description, setDescription] = useState(base.description ?? "")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [duplicateName, setDuplicateName] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    const trimmedName = name.trim()
    if (!trimmedName) {
      errors.name = "이름을 입력해 주세요."
    } else if (trimmedName.length > CATEGORY_NAME_MAX) {
      errors.name = `이름은 ${CATEGORY_NAME_MAX}자를 넘을 수 없습니다.`
    }
    const trimmedColor = color.trim()
    if (trimmedColor && !CATEGORY_COLOR_PATTERN.test(trimmedColor)) {
      errors.color = "색상은 #RRGGBB 형식으로 입력해 주세요."
    }
    if (description.length > CATEGORY_DESCRIPTION_MAX) {
      errors.description = `설명은 ${CATEGORY_DESCRIPTION_MAX}자를 넘을 수 없습니다.`
    }
    return errors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return // 응답 대기 중 중복 제출 차단
    const errors = validate()
    setFieldErrors(errors)
    setDuplicateName(false)
    setFormError(null)
    if (errors.name || errors.color || errors.description) return

    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        color: color.trim() ? color.trim() : null,
        description: description.trim() ? description.trim() : null,
      })
      setSubmitting(false)
      onSubmitted()
    } catch (error) {
      if (error instanceof DuplicateCategoryNameError) {
        setDuplicateName(true)
      } else {
        setFormError("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      }
      setSubmitting(false)
    }
  }

  const submitLabel = mode === "create" ? "만들기" : "저장"
  const submittingLabel = mode === "create" ? "만드는 중..." : "저장 중..."

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {duplicateName && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>
            같은 이름의 카테고리가 이미 있습니다. 다른 이름을 입력해 주세요.
          </AlertDescription>
        </Alert>
      )}
      {formError && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-name">이름</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "category-name-error" : undefined}
          autoComplete="off"
        />
        {fieldErrors.name && (
          <p id="category-name-error" className="text-sm text-destructive">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-color">색상</Label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              aria-label={`색상 ${preset} 선택`}
              aria-pressed={color.toLowerCase() === preset.toLowerCase()}
              className={cn(
                "size-6 rounded-full border outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                color.toLowerCase() === preset.toLowerCase() &&
                  "ring-ring/50 ring-[3px]",
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            id="category-color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#RRGGBB"
            aria-invalid={Boolean(fieldErrors.color)}
            aria-describedby={
              fieldErrors.color ? "category-color-error" : undefined
            }
            autoComplete="off"
            className="font-mono"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setColor("")}
            disabled={!color}
          >
            지우기
          </Button>
        </div>
        {fieldErrors.color && (
          <p id="category-color-error" className="text-sm text-destructive">
            {fieldErrors.color}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-description">설명</Label>
        <Textarea
          id="category-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="카테고리 설명 (선택)"
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={
            fieldErrors.description ? "category-description-error" : undefined
          }
        />
        {fieldErrors.description && (
          <p
            id="category-description-error"
            className="text-sm text-destructive"
          >
            {fieldErrors.description}
          </p>
        )}
      </div>

      <DialogFooter>
        <DialogClose
          render={<Button type="button" variant="outline" />}
          disabled={submitting}
        >
          취소
        </DialogClose>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default CategoryFormDialog
