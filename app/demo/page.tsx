import { DemoSniper } from "./DemoSniper";

export default function DemoPage() {
  return (
    <>
      <h1>Auto-hold <em>demo</em></h1>
      <p className="lede">
        The next level: when your price hits, the bot doesn&apos;t just ping you, it <b>reserves the seat</b> so you have time to decide.
        This runs on a real airline booking API in <b>test mode</b> (sandbox airlines, no real ticket, no money).
      </p>
      <DemoSniper />
      <p className="note" style={{ marginTop: 20 }}>
        Why test mode? Holding real seats for strangers needs a licensed booking account and your passenger details.
        Not every airline allows free holds either. The watcher on the home page works for real, today.
      </p>
    </>
  );
}
