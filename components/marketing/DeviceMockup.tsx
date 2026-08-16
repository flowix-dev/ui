import ChatMock from "./ChatMock";
import WorkflowEditorMock from "./WorkflowEditorMock";

export default function DeviceMockup() {
  return (
    <div className="mt-16">
      <div className="mx-auto max-w-sm sm:hidden">
        <ChatMock />
      </div>

      <div className="relative mx-auto mt-12 hidden max-w-3xl pb-28 sm:block">
        <div className="rounded-xl border border-hairline-strong bg-surface-card p-1.5 shadow-soft">
          <div className="overflow-hidden rounded-lg bg-white">
            <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-semantic-error" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent-warning" />
                <span className="h-2.5 w-2.5 rounded-full bg-semantic-success" />
              </span>
              <span className="ml-2 hidden items-center gap-2 rounded-md bg-surface-strong px-3 py-1 font-mono text-xs text-body sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-semantic-success" />
                app.flowix.dev/workflows
              </span>
            </div>
            <WorkflowEditorMock />
          </div>
          <div className="flex justify-center py-1.5">
            <div className="h-1 w-28 rounded-full bg-surface-strong" />
          </div>
        </div>

        <div className="absolute -bottom-4 right-0 hidden w-48 lg:block">
          <ChatMock />
        </div>
      </div>
    </div>
  );
}
