import { BackToApp } from './BackToApp';
import { RECORDED } from './session';
import './hosted.css';

const PRIVACY = 'https://docs.coppertide.ai/privacy';

/** What PostHog receives, by source. */
function Received() {
  return (
    <>
      <h2>What PostHog receives</h2>
      <ul>
        <li>
          <strong>Who you are:</strong> your account id, email and name, and your organization's id (a personal one is named only &quot;Personal&quot;).
        </li>
        <li>
          <strong>From this site:</strong> that you signed up or signed in, and how (password, Google or GitHub), a new organization, and an accepted invite.
        </li>
        <li>
          <strong>From your browser,</strong> in CopperTide and in hosted Shakedown: the pages you open, with names in addresses replaced (for example <code>/team/:id/structure</code>), the buttons you click,
          and a few named actions such as importing a team file or downloading a run.
        </li>
        <li>
          <strong>What any website sees:</strong> your browser, operating system, device type, screen size and IP address. PostHog is set to discard IP
          addresses, and this site's own events ask it not to look them up.
        </li>
        <li>
          <strong>A session replay</strong> (not in Europe): the page's layout and your clicks and scrolling, with every text and every input masked.
        </li>
      </ul>
    </>
  );
}

/** The beta's disclosure: what PostHog receives, what never leaves, and how to opt out. */
export function WhatWeRecord() {
  return (
    <main className="hosted-page hosted-record">
      <BackToApp />
      <h1>What we record</h1>
      <p>{RECORDED}</p>
      <Received />
      <p>
        <strong>Never sent:</strong> what you type, prompts, messages, jobs, agent output, team or agent names, file names and file contents.
      </p>
      <p>
        <strong>To opt out,</strong> turn on Do Not Track or Global Privacy Control in your browser: nothing is then sent, from your browser or
        about your sign-ins. In Europe this site stores no PostHog cookie or local data in
        your browser and records no replay. CopperTide running on your own computer records nothing.
      </p>
      <p className="muted">
        PostHog (PostHog Inc., US) processes this for us. See <a href={PRIVACY}>Privacy</a> for the details.
      </p>
    </main>
  );
}
