import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleHelp } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Dialog, DialogBackdrop, DialogClose, DialogDescription, DialogPopup, DialogPortal, DialogTitle, DialogTrigger } from "./dialog";
import { EmptyState } from "./empty-state";
import { Input } from "./input";
import { LocationLink } from "./location-link";
import { MetricCard } from "./metric-card";
import { Select } from "./select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

function PrimitiveGallery() {
  return (
    <div className="grid gap-6 p-6">
      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground">Buttons and Badges</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button>기본</Button>
          <Button variant="secondary">보조</Button>
          <Button variant="outline">외곽선</Button>
          <Button variant="ghost">고스트</Button>
          <Button variant="destructive">거절</Button>
          <Badge variant="success">GREEN</Badge>
          <Badge variant="warning">경고</Badge>
          <Badge variant="info">BLUE</Badge>
          <Badge size="sm" variant="secondary">Skeleton 검토중</Badge>
          <Badge size="sm" variant="warning">높음</Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button aria-label="도구 설명 확인" size="icon" variant="ghost">
                <CircleHelp className="size-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>아이콘 버튼은 접근 가능한 이름과 도구 설명을 함께 가진다.</TooltipContent>
          </Tooltip>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground">Inputs</h2>
        <div className="mt-4 flex items-center gap-3">
          <Input className="max-w-72 font-mono" defaultValue="REQ-031" />
          <Select
            defaultValue="harness"
            options={[
              { value: "harness", label: "harness" },
              { value: "application", label: "application" },
            ]}
            aria-label="primitive scope"
          />
          <Dialog>
            <DialogTrigger>대화상자</DialogTrigger>
            <DialogPortal>
              <DialogBackdrop />
              <DialogPopup>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle>요건 검색/선택</DialogTitle>
                    <DialogDescription className="mt-2">대화상자 primitive의 제목, 설명, 닫기 버튼, 배경 레이어를 검토한다.</DialogDescription>
                  </div>
                  <DialogClose aria-label="primitive 대화상자 닫기" />
                </div>
              </DialogPopup>
            </DialogPortal>
          </Dialog>
        </div>
      </Card>
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="RED" value={7} />
        <MetricCard label="GREEN" value={0} />
        <MetricCard label="BLUE" value={7} />
        <MetricCard label="Source" value="10건" />
      </div>
      <Alert variant="warning">
        <AlertTitle>오래된 데이터 경고</AlertTitle>
        <AlertDescription>원본 문서가 산출물 생성 이후에 변경되었다.</AlertDescription>
      </Alert>
      <EmptyState>조건에 맞는 항목이 없다.</EmptyState>
      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground">Location Link</h2>
        <LocationLink className="mt-3" file="/Users/redstone/Workspace/claude/bdd-workflow/harness/docs/requirements/REQ-032-harness-ui-requirement-detail.md" line={1} />
      </Card>
      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground">Tabs</h2>
        <Tabs defaultValue="overview" className="mt-4">
          <TabsList aria-label="primitive tabs">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="contracts">계약</TabsTrigger>
            <TabsTrigger value="findings">판정</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="rounded-md border border-border p-4 text-sm text-muted-foreground">
            요건 메타데이터와 주요 상태를 좁은 면적에서 전환해 확인한다.
          </TabsContent>
          <TabsContent value="contracts" className="rounded-md border border-border p-4 text-sm text-muted-foreground">
            API, Request, Response, Entity 구성을 탭 안에서 분리한다.
          </TabsContent>
          <TabsContent value="findings" className="rounded-md border border-border p-4 text-sm text-muted-foreground">
            RED 사유와 BLUE 차단 사유를 판정 탭에서 확인한다.
          </TabsContent>
        </Tabs>
      </Card>
      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground">Collapsible</h2>
        <Collapsible className="mt-4">
          <CollapsibleTrigger>
            Request 펼치기
            <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">RequirementDetailRequest</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-[1fr_1fr_4rem] gap-2 text-sm">
              <div className="font-medium text-foreground">requirementId</div>
              <div className="font-mono text-xs text-muted-foreground">string</div>
              <div className="text-xs text-muted-foreground">필수</div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>요건</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>우선순위</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono">REQ-031</TableCell>
              <TableCell><Badge variant="destructive">RED</Badge></TableCell>
              <TableCell>높음</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono">REQ-010</TableCell>
              <TableCell><Badge variant="info">BLUE</Badge></TableCell>
              <TableCell>높음</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

const meta = {
  title: "Harness/UI/Primitives",
  component: PrimitiveGallery,
  parameters: {
    harness: { requirements: ["REQ-030"] },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

\`harness/ui\`가 소유한 Base UI-compatible shadcn/ui primitive를 한 화면에서 검토한다.

### 관찰 포인트

- Base UI는 상호작용 primitive의 내부 기반으로만 쓰고 app primitive나 app 테마를 직접 공유하지 않는다.
- 버튼, 선택, 탭, 펼침, 뱃지, 도구 설명, 입력, 경고, 빈 상태, 위치 링크, 표가 하네스 관제 화면의 밀도에 맞게 보인다.
- 상태 의미는 색상뿐 아니라 텍스트 라벨로도 드러난다.
        `.trim(),
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PrimitiveGallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "하네스 UI primitive의 기본 조합 상태다. 업무 화면에 들어가기 전 공통 스타일 토큰과 상호작용 요소의 밀도를 확인한다.",
      },
    },
  },
};
