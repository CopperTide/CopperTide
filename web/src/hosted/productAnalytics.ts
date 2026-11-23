/**
 * Product analytics in PostHog, for the hosted app only. It starts when someone is signed in *and*
 * the gateway hands over a project key (`/gw/api/me` → `posthog`); local CopperTide has neither, so
 * posthog-js is never loaded and nothing is sent. Options, masking and address templating are in
 * `posthogShared.ts`, shared with Shakedown's UI; this file names CopperTide's routes and actions.
 */
import type { HostedOrg, HostedUser, PostHogSettings } from './session';
import { productAnalytics, routeTemplater } from './posthogShared';

/** The named actions worth counting beyond autocaptured clicks. Names only, never what they act on. */
export type ProductEvent =
  | 'describe it opened'
  | 'team file exported'
  | 'team file imported'
  | 'run imported'
  | 'run downloaded'
  | 'question answered'
  | 'community block added';

/** The app's page routes, with `{param}` where a name or id goes. */
const PAGES = [
  '/', '/account', '/admin', '/community', '/computers', '/connect', '/join/{token}', '/library', '/library/{collection}', '/login', '/reset/{token}',
  '/rig/{rig}', '/rig/{rig}/agent/{seat}', '/rig/{rig}/agent/{seat}/{tab}', '/team/{team}', '/team/{team}/git', '/team/{team}/live',
  '/team/{team}/progress', '/team/{team}/structure', '/what-we-record',
];
const SECTIONS = ['account', 'team', 'rig', 'library', 'community', 'join', 'reset', 'admin', 'connect', 'computers', 'what-we-record', 'login'];

/** `/team/secret-plan/structure` → `/team/:id/structure`: a team called "library" is still `:id`. */
export const routeTemplate = routeTemplater(PAGES, SECTIONS);

const analytics = productAnalytics<ProductEvent>(routeTemplate);

/** Starts PostHog for a signed-in person, once; nothing without settings. */
export const startProductAnalytics = (user: HostedUser, org: HostedOrg | null, settings: PostHogSettings | null) => analytics.start(settings, user, org);
/** On sign-out: forget who this browser was. */
export const stopProductAnalytics = () => analytics.stop();
/** A named action, while PostHog runs (never in local mode). */
export const track = (event: ProductEvent) => analytics.track(event);
