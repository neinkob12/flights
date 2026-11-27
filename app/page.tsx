import { WatchForm } from "@/components/WatchForm";

export default function Home() {
  return (
    <>
      <h1>Set your price.<br /><em>We snipe the fare.</em></h1>
      <p className="lede">Pick a route, flexible dates and the most you want to pay. The moment it drops below, you get a one-tap booking link on Telegram or email. Free, no account.</p>
      <WatchForm />
      <div className="how">
        <div><b>1</b>Tell us the route, dates and your max price.</div>
        <div><b>2</b>We check prices every hour, worldwide.</div>
        <div><b>3</b>Price hits? You get a link straight to checkout, plus tips to lock it in.</div>
      </div>
    </>
  );
}
