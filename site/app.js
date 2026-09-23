'use strict';
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tokens = value => String(value || '').split(/[;,]/).map(s => s.trim()).filter(Boolean);
const normalize = value => String(value || '').normalize('NFKD').replace(/[\p{M}\p{Cf}]/gu, '').toLowerCase();
function safeLink(url, label) {
  try { const parsed = new URL(url); if (['https:', 'http:'].includes(parsed.protocol)) return `<a href="${escapeHTML(parsed.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>`; } catch {}
  return escapeHTML(label);
}
const fields = {description:'Full description', period:'Historical period', creators:'Creators', dates:'Publication / maintenance dates', audiences:'Audiences', funding:'Funding sources', wiki:'Digital Classicist Wiki', checked:'Date checked', status:'Project status', metadata:'Metadata status', duplicate:'Duplicate of', notes:'Notes'};
function resource(row) {
  let title = safeLink(row.url, row.title).replace('<a ', '<a class="resource-title" ');
  if (!title.startsWith('<a ')) title = `<span class="resource-title">${title}</span>`;
  const details = Object.entries(fields).map(([key,label]) => `<dt>${label}</dt><dd>${row[key] ? (key === 'wiki' ? safeLink(row[key], row[key]) : escapeHTML(row[key])) : 'Not recorded'}</dd>`).join('');
  const preview = row.description.length > 230 ? row.description.slice(0,230).replace(/\s+\S*$/, '') + '…' : row.description;
  return `${title}<p class="description">${escapeHTML(preview || 'No description recorded.')}</p><details class="resource-details"><summary>Resource details<span class="sr-only"> for ${escapeHTML(row.title)}</span></summary><dl>${details}</dl></details>`;
}
async function init() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Data unavailable');
    const data = await response.json();
    const records = data.records;
    const selectFields = ['technologies', 'keywords', 'audiences', 'status'];
    const textFields = ['title', 'creators', 'period', 'funding'];
    for (const key of selectFields) {
      const values = new Map();
      records.forEach(row => (key === 'status' ? [row[key] || 'Not recorded'] : tokens(row[key])).forEach(value => { if (!values.has(normalize(value))) values.set(normalize(value), value); }));
      for (const [value, label] of [...values].sort((a,b) => a[1].localeCompare(b[1]))) document.getElementById(key).add(new Option(label,value));
    }
    const table = new DataTable('#resources', {
      data: records, pageLength: 10, order: [[0,'asc']],
      layout: {topStart:null,topEnd:null,bottomStart:'pageLength',bottomEnd:'paging'},
      language:{emptyTable:'No resources available.',zeroRecords:'No resources match these filters. Try fewer fields or clear the filters.'},
      columns:[
        {data:null, render:(value,type,row) => type === 'display' ? resource(row) : row.title},
        ...['technologies','keywords'].map(key => ({data:key,render:(value,type) => type === 'display' ? (value ? `<div class="tags">${tokens(value).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}</div>` : '<span class="status">Not recorded</span>') : value})),
        {data:'status',render:(value,type) => type === 'display' ? `<span class="status">${escapeHTML(value || 'Not recorded')}</span>` : value}
      ]
    });
    table.search.fixed('fields', (_search,row) => {
      const terms = normalize(document.getElementById('search').value).trim().split(/\s+/).filter(Boolean);
      const fullText = normalize(Object.values(row).join(' '));
      return terms.every(term => fullText.includes(term)) && selectFields.every(key => {
        const selected = document.getElementById(key).value;
        const values = key === 'status' ? [row[key] || 'Not recorded'] : tokens(row[key]);
        return !selected || values.some(value => normalize(value) === selected);
      }) && textFields.every(key => normalize(row[key]).includes(normalize(document.getElementById(key).value).trim()));
    });
    function updateCount() { const n = table.rows({search:'applied'}).count(); document.getElementById('result-count').textContent = `${n} of ${records.length} resources`; }
    table.on('draw',updateCount);
    [...selectFields,...textFields,'search'].forEach(key => document.getElementById(key).addEventListener(selectFields.includes(key) ? 'change' : 'input', () => table.draw()));
    document.getElementById('clear').addEventListener('click',() => { [...selectFields,...textFields,'search'].forEach(key => document.getElementById(key).value=''); table.search('').draw(); });
    document.getElementById('total').textContent = records.length;
    document.getElementById('updated').textContent = `Data imported ${new Date(data.importedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
    table.draw();
    if (records.length) {
      const selected = records[Math.floor(Math.random() * records.length)];
      document.getElementById('featured-resource').innerHTML = resource(selected);
      document.getElementById('explore').hidden = false;
    }
  } catch (error) { document.getElementById('error').hidden = false; document.getElementById('result-count').textContent = 'Collection unavailable'; console.error(error); }
}
init();
