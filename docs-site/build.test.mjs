// Builds the site into a temporary folder and checks what a reader gets: every page in docs.json,
// working navigation, rendered components, and no raw MDX left in the output.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { brokenLinks, build } from './build.mjs';

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-'));
try {
  await build(out);
  const nav = JSON.parse(fs.readFileSync(new URL('./docs.json', import.meta.url), 'utf8')).navigation.groups;
  const pages = nav.flatMap((g) => g.pages);
  for (const page of pages) {
    const file = path.join(out, `${page}.html`);
    assert.ok(fs.existsSync(file), `${page}.html is built`);
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<title>[^<]+ · Shakedown docs<\/title>/, `${page} has a title`);
    assert.doesNotMatch(html, /<(Card|CardGroup|Steps|Step|Note|Tip|Info|Check|Warning|Tabs|Tab|AccordionGroup|Accordion|Frame)[\s>]/, `${page} has no raw components`);
    for (const other of pages) assert.ok(html.includes(`href="/${other}"`), `${page} links to ${other} in the sidebar`);
    assert.ok(html.includes(`aria-current="page" href="/${page}"`), `${page} marks itself current`);
  }
  const intro = fs.readFileSync(path.join(out, 'introduction.html'), 'utf8');
  assert.match(intro, /<a class="card" href="\/quickstart">/, 'cards are links');
  assert.match(intro, /<aside class="callout note"/, 'notes are callouts');
  const quick = fs.readFileSync(path.join(out, 'quickstart.html'), 'utf8');
  assert.match(quick, /<ol class="steps">/, 'steps are an ordered list');
  assert.equal(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), intro, 'the home page is the introduction');
  assert.ok(fs.existsSync(path.join(out, 'images/coppertide-mark.png')), 'images are copied');
  const llms = fs.readFileSync(path.join(out, 'llms.txt'), 'utf8');
  for (const page of pages) {
    assert.ok(llms.includes(`(/${page}.md)`), `llms.txt lists ${page}`);
    assert.ok(fs.existsSync(path.join(out, `${page}.md`)), `${page}.md is published for agents`);
  }
  assert.ok(fs.readFileSync(path.join(out, 'llms-full.txt'), 'utf8').includes('# Quickstart'), 'llms-full.txt holds every page');
  for (const page of pages) {
    const html = fs.readFileSync(path.join(out, `${page}.html`), 'utf8');
    if (html.includes('class="tabs"')) assert.match(html, /<section class="tab" data-title="[^"]+">/, `${page}'s tabs have titles`);
  }
  for (const f of ['session-v1.json']) {
    assert.ok(JSON.parse(fs.readFileSync(path.join(out, 'schema', f), 'utf8')).$schema, `the ${f} schema is published`);
  }
  // Images: every image a page uses exists, is small, and says what it shows.
  let shots = 0;
  for (const page of pages) {
    const mdx = fs.readFileSync(new URL(`./${page}.mdx`, import.meta.url), 'utf8');
    for (const [, alt, src] of mdx.matchAll(/!\[([^\]]*)\]\((\/images\/[^)\s]+)\)/g)) {
      const file = new URL(`.${src}`, import.meta.url);
      assert.ok(fs.existsSync(file), `${page}: ${src} exists`);
      assert.ok(fs.statSync(file).size <= 400 * 1024, `${page}: ${src} is at most 400 KB`);
      assert.ok(alt.trim().length > 0, `${page}: ${src} has alt text`);
      shots += 1;
    }
  }
  // Links: the build refuses a page that links to no page, to a missing file or to an anchor.
  const ids = new Set(['a', 'b/c']);
  const roots = [new URL('./images', import.meta.url).pathname, new URL('../web/public/schema', import.meta.url).pathname];
  const html = new Map([['a', '<a href="/b/c">ok</a><a href="/b/d">gone</a><a href="/a#x">anchor</a><a href="b/c">relative</a><a href="/images/coppertide-mark.png">img</a><a href="https://x.y">out</a>']]);
  assert.deepEqual(brokenLinks(html, ids, roots), ['a: /b/d (no such page)', 'a: /a#x (headings have no anchors)', 'a: b/c (not a site path)'], 'broken links are named');
  const site = JSON.parse(fs.readFileSync(new URL('./docs.json', import.meta.url), 'utf8'));
  assert.equal(site.name, 'Shakedown', 'the site is called Shakedown');
  assert.ok(fs.readFileSync(path.join(out, 'introduction.html'), 'utf8').includes('Shakedown docs</a>'), 'the header names the site');
  console.log(`build.test: ok (${pages.length} pages, ${shots} images)`);
} finally {
  fs.rmSync(out, { recursive: true, force: true });
}
