import { Button } from "./button";
import { Alert, AlertDescription, AlertTitle } from "./alert";

export function ErrorState({ message = "조회 실패" }: { message?: string }) {
  return (
    <Alert variant="destructive" className="p-6">
      <AlertTitle>조회 실패</AlertTitle>
      <AlertDescription className="mt-1">{message}</AlertDescription>
      <Button className="mt-4" size="sm" variant="outline">
        다시 시도
      </Button>
    </Alert>
  );
}
