// The first-run choice. The preload exposes only `coppertide.choose(mode, origin)` and the default address.
const $ = (id) => document.getElementById(id);
$('account').value = window.coppertide.defaultOrigin || '';
$('local-account').value = window.coppertide.defaultOrigin || '';
const show = (message) => { $('error').textContent = message || ''; };
$('local').addEventListener('click', async () => show(await window.coppertide.choose('local', $('local-account').value.trim() || null)));
$('use-account').addEventListener('click', async () => show(await window.coppertide.choose('account', $('account').value.trim())));
