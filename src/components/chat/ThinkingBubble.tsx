export function ThinkingBubble({ seconds }: { seconds: number }) {
  return <div className="chat-bubble assistant thinking" role="status">
    <span className="thinking-dots" aria-hidden="true"><span /><span /><span /></span> Pensando… {seconds} s
  </div>
}
