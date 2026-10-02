import './styles.css';
import './motion.css';
import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { open, save, confirm } from '@tauri-apps/plugin-dialog';
import { openUrl } from '@tauri-apps/plugin-opener';
import { estimatedCompressionLevel, formatBytes, movePage, normalizedRotation, outputName, pageOrder, parsePageExpression, splitGroups } from './pdf-engine.js';

const icons = {
  home:'<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  merge:'<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M3 8h5M3 12h5M3 16h5"/></svg>',
  split:'<svg viewBox="0 0 24 24"><path d="M12 3v18M5 7h4M5 12h4M5 17h4M15 7h4M15 12h4M15 17h4"/></svg>',
  pages:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="12" height="16" rx="2"/><path d="M8 7h4M8 11h5M8 15h3M16 7h4v14H8v-2"/></svg>',
  compress:'<svg viewBox="0 0 24 24"><path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"/><path d="m3 8 5-5M21 8l-5-5M3 16l5 5M21 16l-5 5"/></svg>',
  metadata:'<svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h5M10 12h6M10 16h6M10 8h2"/></svg>',
  lock:'<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>',
  unlock:'<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2M12 14v3"/></svg>',
  image:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 5"/></svg>',
  history:'<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>',
  settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></svg>',
  folder:'<svg viewBox="0 0 24 24"><path d="M3 6.5h6l2 2h10V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  file:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 2.75h6.3l4.95 4.95V19A2.25 2.25 0 0 1 17 21.25H8A2.25 2.25 0 0 1 5.75 19V5A2.25 2.25 0 0 1 8 2.75Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14.25 2.75V7.5H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.9 11h6.2M8.9 14.2h6.2M8.9 17.4h4.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  trash:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/></svg>',
  rotate:'<svg viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M18 17a8 8 0 1 1 2-5"/></svg>',
  up:'<svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>',
  down:'<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>',
  chevron:'<svg viewBox="0 0 24 24"><path d="m7 9 5 5 5-5"/></svg>',
  sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg viewBox="0 0 24 24"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5z"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>',
  globe:'<svg class="globe-icon" viewBox="0 0 390 390" aria-hidden="true"><path d="M195,0C87.305,0,0,87.304,0,195s87.305,195,195,195s195-87.304,195-195S302.695,0,195,0z M119.524,45.678c-3.493,4.838-6.838,10.033-10.007,15.6c-4.841,8.503-9.16,17.656-12.945,27.33c-8.064-2.22-16.089-4.713-24.064-7.483C85.91,66.718,101.813,54.667,119.524,45.678z M52.298,107.694c11.438,4.293,22.976,8.056,34.591,11.293c-4.78,18.934-7.744,39.182-8.745,60.087h-49.72C30.888,153.108,39.305,128.852,52.298,107.694z M52.298,282.306c-12.994-21.159-21.411-45.414-23.874-71.38h49.72c1.002,20.905,3.965,41.153,8.745,60.087C75.274,274.25,63.736,278.013,52.298,282.306z M72.508,308.876c7.975-2.77,16-5.265,24.063-7.483c3.786,9.674,8.105,18.827,12.946,27.33c3.168,5.566,6.514,10.762,10.007,15.6C101.813,335.333,85.91,323.283,72.508,308.876z M179.074,354.07c-20.393-7.648-38.458-29.593-51.05-59.894c16.931-3.125,33.977-5.059,51.05-5.8V354.07z M179.074,256.454c-20.448,0.818-40.862,3.221-61.117,7.191c-4.16-16.355-6.908-34.13-7.915-52.72h69.032V256.454z M179.074,179.074h-69.032c1.007-18.59,3.755-36.365,7.915-52.72c20.254,3.971,40.669,6.373,61.117,7.191V179.074z M179.074,101.623c-17.073-.741-34.118-2.675-51.05-5.8c12.592-30.301,30.657-52.245,51.05-59.894V101.623z M337.703,107.697c12.993,21.157,21.409,45.412,23.872,71.377h-49.72c-1.001-20.903-3.965-41.151-8.744-60.083C314.727,115.754,326.266,111.992,337.703,107.697z M317.495,81.128c-7.975,2.77-16,5.265-24.065,7.484c-3.786-9.676-8.105-18.831-12.947-27.335c-3.169-5.566-6.514-10.762-10.006-15.6C288.189,54.668,304.092,66.72,317.495,81.128z M210.926,35.93c20.393,7.648,38.459,29.595,51.051,59.898c-16.931,3.124-33.977,5.057-51.051,5.797V35.93z M210.926,133.547c20.45-.817,40.865-3.219,61.118-7.188c4.16,16.354,6.907,34.128,7.914,52.716h-69.032V133.547z M210.926,210.926h69.032c-1.007,18.588-3.754,36.362-7.914,52.716c-20.253-3.97-40.668-6.371-61.118-7.189V210.926z M210.926,354.07v-65.694c17.075.741,34.121,2.673,51.051,5.798C249.385,324.475,231.319,346.422,210.926,354.07z M270.477,344.322c3.493-4.838,6.838-10.033,10.006-15.6c4.842-8.504,9.161-17.659,12.947-27.334c8.064,2.22,16.089,4.714,24.065,7.484C304.092,323.28,288.189,335.332,270.477,344.322z M337.703,282.304c-11.437-4.296-22.976-8.058-34.591-11.296c4.779-18.932,7.742-39.179,8.744-60.082h49.72C359.112,236.891,350.696,261.146,337.703,282.304z"/></svg>',
  coffee:'<svg width="24px" height="24px" viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="m20.216 6.415-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 0 0-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 0 0-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 0 1-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 0 1 3.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 0 1-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 0 1-4.743.295 37.059 37.059 0 0 1-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0 0 11.343.376.483.483 0 0 1 .535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 0 1 .39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 0 1-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a5.884 5.884 0 0 1-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38 0 0 1.243.065 1.658.065.447 0 1.786-.065 1.786-.065.783 0 1.434-.6 1.499-1.38l.94-9.95a3.996 3.996 0 0 0-1.322-.238c-.826 0-1.491.284-2.26.613z"/></svg>'
};

const app = document.querySelector('#app');
const isTauri = '__TAURI_INTERNALS__' in window;
const saved = JSON.parse(localStorage.getItem('davpdf-settings') || '{}');
const state = {
  page:'home',
  settings:{ theme:saved.theme || 'system', language:saved.language || 'it' },
  files:[],
  current:null,
  password:'',
  pageOrder:[],
  rotations:{},
  splitMode:'ranges',
  splitExpression:'1-4;5-8',
  splitEvery:2,
  compression:'balanced',
  activity:JSON.parse(localStorage.getItem('davpdf-activity') || '[]'),
  metadataForm:{},
  conversionMode:'pdfToImages',
  renderFormat:'png',
  renderDpi:150,
  renderPages:'',
  renderJpegQuality:90,
  imageFiles:[],
  imagePageSize:'a4',
  imageOrientation:'portrait',
  imageMargin:10,
  imageFitMode:'fit',
  pageThumbnails:{},
  thumbnailBusy:false,
  busy:false,
  appVersion:''
};

const t = (it, en) => state.settings.language === 'en' ? en : it;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[char]);
const escapeAttr = escapeHtml;
const basename = (path) => String(path || '').split(/[\\/]/).filter(Boolean).at(-1) || '';

function persistSettings() {
  localStorage.setItem('davpdf-settings', JSON.stringify(state.settings));
}

function persistActivity() {
  localStorage.setItem('davpdf-activity', JSON.stringify(state.activity.slice(0, 100)));
}

function resolvedTheme() {
  if (state.settings.theme !== 'system') return state.settings.theme;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme() {
  document.documentElement.dataset.theme = resolvedTheme();
  document.documentElement.lang = state.settings.language;
}

function runUiTransition(kind, change) {
  document.documentElement.dataset.uiTransition = kind;
  if (document.startViewTransition) {
    const transition = document.startViewTransition(change);
    transition.finished.finally(() => delete document.documentElement.dataset.uiTransition);
    return;
  }
  document.documentElement.dataset.uiTransition = `${kind}-out`;
  setTimeout(() => {
    change();
    document.documentElement.dataset.uiTransition = `${kind}-in`;
    setTimeout(() => delete document.documentElement.dataset.uiTransition, 430);
  }, 180);
}

function navButton(page, icon, label, badge='') {
  return `<button class="nav-item ${state.page === page ? 'active' : ''}" data-page="${page}">${icon}<span>${label}</span>${badge ? `<small>${badge}</small>` : ''}</button>`;
}

function shell(content, motion='page') {
  applyTheme();
  app.innerHTML = `<div class="shell" data-motion-mode="${motion}"><aside class="sidebar"><div class="brand"><span>_dav</span>PDF</div><nav>${navButton('home',icons.home,t('Home','Home'))}${navButton('merge',icons.merge,t('Unisci','Merge'))}${navButton('split',icons.split,t('Dividi','Split'))}${navButton('pages',icons.pages,t('Pagine','Pages'))}${navButton('compress',icons.compress,t('Comprimi','Compress'))}${navButton('metadata',icons.metadata,'Metadata')}${navButton('protect',icons.lock,t('Proteggi','Protect'))}${navButton('unlock',icons.unlock,'Unlock')}${navButton('images',icons.image,t('Conversioni','Conversions'))}${navButton('activity',icons.history,t('Attività','Activity'))}${navButton('settings',icons.settings,t('Impostazioni','Settings'))}</nav><div class="sidebar-bottom"><button class="coffee-button" data-action="coffee">${icons.coffee}<span>${t('Comprami Un Caffè','Buy Me A Coffee')}</span></button><button class="icon-button theme-toggle" data-action="theme"><span class="theme-icon theme-icon-sun">${icons.sun}</span><span class="theme-icon theme-icon-moon">${icons.moon}</span></button></div></aside><main class="main">${content}</main></div><div id="toast-region"></div>`;
  bindGlobal();
}

function render(motion='page') {
  if (state.page === 'home') return renderHome(motion);
  if (state.page === 'merge') return renderMerge(motion);
  if (state.page === 'split') return renderSplit(motion);
  if (state.page === 'pages') return renderPages(motion);
  if (state.page === 'compress') return renderCompress(motion);
  if (state.page === 'metadata') return renderMetadata(motion);
  if (state.page === 'protect') return renderProtect(motion);
  if (state.page === 'unlock') return renderUnlock(motion);
  if (state.page === 'images') return renderConversions(motion);
  if (state.page === 'activity') return renderActivity(motion);
  return renderSettings(motion);
}

function header(eyebrow, title, actions='') {
  return `<header class="topbar"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div><div class="top-actions">${actions}</div></header>`;
}

function renderHome(motion) {
  const tools = [
    ['merge',icons.merge,t('Unisci PDF','Merge PDF'),t('Combina più documenti nell’ordine che scegli.','Combine multiple documents in the order you choose.')],
    ['split',icons.split,t('Dividi PDF','Split PDF'),t('Ogni pagina, ogni N pagine o intervalli personalizzati.','Every page, every N pages, or custom ranges.')],
    ['pages',icons.pages,t('Gestisci pagine','Page manager'),t('Riordina, ruota, elimina ed estrai pagine.','Reorder, rotate, delete, and extract pages.')],
    ['compress',icons.compress,t('Comprimi PDF','Compress PDF'),t('Ottimizzazione strutturale senza promesse irreali.','Structural optimization without unrealistic promises.')],
    ['metadata',icons.metadata,'Metadata',t('Leggi, modifica o rimuovi i metadata del documento.','Read, edit, or remove document metadata.')],
    ['protect',icons.lock,t('Proteggi PDF','Protect PDF'),t('Aggiungi una password di apertura al documento.','Add an open password to the document.')],
    ['unlock',icons.unlock,'Unlock PDF',t('Rimuovi la protezione quando conosci la password.','Remove protection when you know the password.')],
    ['images',icons.image,t('PDF ↔ Immagini','PDF ↔ Images'),t('Esporta pagine in immagini o crea PDF da raccolte di immagini.','Export pages as images or create PDFs from image collections.')]
  ];
  shell(`${header(`_davPDF${state.appVersion ? ` · v${escapeHtml(state.appVersion)}` : ''}`,t('PDF toolbox locale','Local PDF toolbox'))}<section class="pdf-hero panel"><div class="pdf-hero-mark">${icons.file}</div><div><h2>${t('Tutto il necessario, senza caricare documenti online.','Everything you need, without uploading documents online.')}</h2><p>${t('Gli originali restano intatti: ogni operazione genera un nuovo PDF e scrive prima su un file temporaneo.','Originals stay untouched: every operation creates a new PDF and writes to a temporary file first.')}</p></div></section><section class="tool-grid">${tools.map(([page,icon,title,copy])=>`<button class="panel tool-card" data-tool="${page}"><span class="tool-icon">${icon}</span><strong>${title}</strong><small>${copy}</small><span class="tool-arrow">→</span></button>`).join('')}</section><section class="trust-row"><div><strong>${t('Elaborazione locale','Local processing')}</strong><span>${t('Nessun upload e nessuna telemetria.','No uploads and no telemetry.')}</span></div><div><strong>${t('Originali protetti','Originals protected')}</strong><span>${t('Gli output vengono sempre creati come nuovi file.','Outputs are always created as new files.')}</span></div><div><strong>${t('Multipiattaforma','Cross-platform')}</strong><span>Windows · macOS · Linux</span></div></section>`,motion);
  document.querySelectorAll('[data-tool]').forEach((node)=>node.addEventListener('click',()=>{state.page=node.dataset.tool;render('page');}));
}

function pdfDrop(title, copy, multiple=false) {
  return `<div class="drop-zone" data-drop-pdf><div class="drop-icon">${icons.file}</div><h2>${title}</h2><p>${copy}</p><button class="button primary" data-action="pick-pdf" data-multiple="${multiple}">${icons.plus}${multiple ? t('Aggiungi PDF','Add PDFs') : t('Apri PDF','Open PDF')}</button></div>`;
}

function pdfList() {
  return `<div class="pdf-list">${state.files.map((file,index)=>`<div class="pdf-row"><span class="pdf-file-icon">${icons.file}</span><div><strong>${escapeHtml(file.name)}</strong><small>${file.pages} ${t('pagine','pages')} · ${formatBytes(file.size)}${file.encrypted ? ` · ${t('Protetto','Protected')}` : ''}</small></div><div class="row-actions"><button class="icon-button" data-move-file="${index}" data-dir="-1" ${index===0?'disabled':''}>${icons.up}</button><button class="icon-button" data-move-file="${index}" data-dir="1" ${index===state.files.length-1?'disabled':''}>${icons.down}</button><button class="icon-button" data-remove-file="${index}">${icons.trash}</button></div></div>`).join('')}</div>`;
}

function renderMerge(motion) {
  const totalPages=state.files.reduce((sum,file)=>sum+file.pages,0);
  const totalSize=state.files.reduce((sum,file)=>sum+file.size,0);
  shell(`${header(t('Combinazione documenti','Document combination'),t('Unisci PDF','Merge PDF'),`<button class="button secondary" data-action="clear-files" ${state.files.length?'':'disabled'}>${t('Svuota','Clear')}</button>`)}<section class="pdf-workspace"><div class="panel pdf-main-card">${state.files.length?`${pdfList()}<button class="button secondary add-more" data-action="pick-pdf" data-multiple="true">${icons.plus}${t('Aggiungi altri PDF','Add more PDFs')}</button>`:pdfDrop(t('Trascina qui i PDF da unire','Drop PDFs to merge here'),t('Riordinali prima di creare il documento finale.','Reorder them before creating the final document.'),true)}</div><aside class="panel pdf-controls"><h2>${t('Output','Output')}</h2><div class="summary-box"><span>${state.files.length} PDF</span><strong>${totalPages} ${t('pagine','pages')}</strong><small>${formatBytes(totalSize)}</small></div><p>${t('Il file finale segue esattamente l’ordine mostrato a sinistra.','The final file follows exactly the order shown on the left.')}</p><button class="button primary full" data-action="run-merge" ${state.files.length<2||state.busy?'disabled':''}>${state.busy?t('Elaborazione…','Processing…'):t('Crea PDF unito','Create merged PDF')}</button></aside></section>`,motion);
  bindFileWorkspace(true);
  document.querySelector('[data-action="run-merge"]')?.addEventListener('click',runMerge);
}

function selectedCard() {
  if (!state.current) return '';
  return `<div class="selected-pdf"><span>${icons.file}</span><div><strong>${escapeHtml(state.current.name)}</strong><small>${state.current.pages} ${t('pagine','pages')} · ${formatBytes(state.current.size)} · PDF ${escapeHtml(state.current.version)}</small></div><button class="button secondary compact" data-action="replace-pdf">${t('Cambia','Change')}</button></div>`;
}

function renderSplit(motion) {
  const groups=state.current?splitGroups(state.splitMode,state.current.pages,state.splitExpression,state.splitEvery):[];
  shell(`${header(t('Suddivisione documento','Document splitting'),t('Dividi PDF','Split PDF'))}<section class="single-tool-grid"><div class="panel pdf-main-card">${state.current?`${selectedCard()}<div class="split-modes">${[['every',t('Ogni pagina','Every page')],['everyN',t('Ogni N pagine','Every N pages')],['ranges',t('Intervalli','Ranges')]].map(([value,label])=>`<button class="${state.splitMode===value?'active':''}" data-split-mode="${value}">${label}</button>`).join('')}</div>${state.splitMode==='everyN'?`<label class="form-field">${t('Pagine per file','Pages per file')}<input type="number" min="1" data-split-every value="${state.splitEvery}"></label>`:''}${state.splitMode==='ranges'?`<label class="form-field">${t('Un gruppo per riga o separato da ;','One group per line or separated by ;')}<textarea data-split-expression rows="6" placeholder="1-4; 8; 10-17">${escapeHtml(state.splitExpression)}</textarea></label>`:''}<div class="range-preview"><span>${t('Output previsti','Expected outputs')}</span><strong>${groups.length}</strong></div>`:pdfDrop(t('Apri il PDF da dividere','Open the PDF to split'),t('L’originale non verrà modificato.','The original will not be modified.'))}</div><aside class="panel pdf-controls"><h2>${t('Suddivisione','Split')}</h2><p>${t('Ogni parte viene prima scritta in un file temporaneo e poi spostata nella cartella scelta.','Each part is first written to a temporary file and then moved to your chosen folder.')}</p><button class="button primary full" data-action="run-split" ${!state.current||!groups.length||state.busy?'disabled':''}>${t('Scegli cartella e dividi','Choose folder and split')}</button></aside></section>`,motion);
  bindSinglePdf();
  document.querySelectorAll('[data-split-mode]').forEach((node)=>node.addEventListener('click',()=>{state.splitMode=node.dataset.splitMode;render('content');}));
  document.querySelector('[data-split-every]')?.addEventListener('input',(event)=>{state.splitEvery=Math.max(1,Number(event.target.value)||1);render();});
  document.querySelector('[data-split-expression]')?.addEventListener('input',(event)=>{state.splitExpression=event.target.value;});
  document.querySelector('[data-action="run-split"]')?.addEventListener('click',runSplit);
}

function renderPages(motion) {
  const cards=state.current?state.pageOrder.map((page,index)=>{const thumbnail=state.pageThumbnails[page];const rotation=normalizedRotation(state.rotations[page]||0);return `<div class="page-card"><div class="page-paper ${thumbnail?'has-thumbnail':''}">${thumbnail?`<img src="${thumbnail}" alt="${t('Pagina','Page')} ${page}" style="transform:rotate(${rotation}deg)">`:`<span>${page}</span>`}<small>${t('Pagina','Page')} ${page} · ${rotation}°</small></div><div class="page-card-actions"><button class="icon-button" data-page-up="${index}" ${index===0?'disabled':''}>${icons.up}</button><button class="icon-button" data-page-down="${index}" ${index===state.pageOrder.length-1?'disabled':''}>${icons.down}</button><button class="icon-button" data-page-rotate="${page}">${icons.rotate}</button><button class="icon-button danger-icon" data-page-delete="${index}" ${state.pageOrder.length<=1?'disabled':''}>${icons.trash}</button></div></div>`;}).join(''):'';
  shell(`${header(t('Organizzazione pagine','Page organization'),t('Page Manager','Page Manager'))}<section class="page-manager">${state.current?`<div class="panel page-manager-head">${selectedCard()}<div class="page-manager-copy"><strong>${state.pageOrder.length} / ${state.current.pages}</strong><span>${t('pagine nell’output','pages in output')}</span></div><button class="button primary" data-action="save-pages">${t('Salva nuova copia','Save new copy')}</button></div>${state.thumbnailBusy?`<div class="thumbnail-status"><span class="loader-ring"></span>${t('Generazione miniature…','Generating thumbnails…')}</div>`:''}<div class="page-grid">${cards}</div>`:`<div class="panel">${pdfDrop(t('Apri un PDF da organizzare','Open a PDF to organize'),t('Riordina, ruota o rimuovi pagine mantenendo intatto l’originale.','Reorder, rotate, or remove pages while keeping the original intact.'))}</div>`}</section>`,motion);
  bindSinglePdf();
  document.querySelectorAll('[data-page-up]').forEach((node)=>node.addEventListener('click',()=>{state.pageOrder=movePage(state.pageOrder,Number(node.dataset.pageUp),-1);render('content');}));
  document.querySelectorAll('[data-page-down]').forEach((node)=>node.addEventListener('click',()=>{state.pageOrder=movePage(state.pageOrder,Number(node.dataset.pageDown),1);render('content');}));
  document.querySelectorAll('[data-page-rotate]').forEach((node)=>node.addEventListener('click',()=>{const page=Number(node.dataset.pageRotate);state.rotations[page]=normalizedRotation((state.rotations[page]||0)+90);render('content');}));
  document.querySelectorAll('[data-page-delete]').forEach((node)=>node.addEventListener('click',()=>{state.pageOrder.splice(Number(node.dataset.pageDelete),1);render('content');}));
  document.querySelector('[data-action="save-pages"]')?.addEventListener('click',runPages);
  if(isTauri&&state.current) queueMicrotask(loadPageThumbnails);
}

async function loadPageThumbnails() {
  if(state.thumbnailBusy||!state.current||state.page!=='pages') return;
  const missing=state.pageOrder.filter((page)=>!state.pageThumbnails[page]);
  if(!missing.length) return;
  state.thumbnailBusy=true;
  const batch=missing.slice(0,18);
  try {
    const result=await invoke('render_pdf_thumbnails',{path:state.current.path,pages:batch,size:220,password:null});
    for(const item of result) state.pageThumbnails[item.page]=item.dataUrl;
  } catch(error) {
    if(!Object.keys(state.pageThumbnails).length) toast(t('Impossibile generare le miniature delle pagine.','Unable to generate page thumbnails.'),'warning');
  } finally {
    state.thumbnailBusy=false;
    if(state.page==='pages') render('content');
  }
}

function renderCompress(motion) {
  shell(`${header(t('Ottimizzazione strutturale','Structural optimization'),t('Comprimi PDF','Compress PDF'))}<section class="single-tool-grid"><div class="panel pdf-main-card">${state.current?`${selectedCard()}<div class="compression-presets">${[['lossless','Lossless'],['high',t('Alta qualità','High quality')],['balanced',t('Bilanciata','Balanced')],['maximum',t('Massima compressione','Maximum compression')]].map(([value,label])=>`<button class="${state.compression===value?'active':''}" data-compression="${value}"><strong>${label}</strong><small>${({lossless:t('Riordino e compressione conservativa','Conservative rewrite and compression'),high:t('Compatibilità e dimensione','Compatibility and size'),balanced:t('Preset consigliato','Recommended preset'),maximum:t('Massima compressione strutturale','Maximum structural compression')})[value]}</small></button>`).join('')}</div>`:pdfDrop(t('Apri il PDF da comprimere','Open the PDF to compress'),t('La riduzione reale dipende da come il PDF è già stato codificato.','Actual reduction depends on how the PDF is already encoded.'))}</div><aside class="panel pdf-controls"><h2>${t('Stima responsabile','Responsible estimate')}</h2><p>${t('Non mostriamo percentuali inventate prima dell’elaborazione. PDF già ottimizzati potrebbero ridursi poco o perfino restare simili.','We do not show invented percentages before processing. Already optimized PDFs may shrink only slightly or remain similar.')}</p><button class="button primary full" data-action="run-compress" ${!state.current||state.busy?'disabled':''}>${t('Comprimi nuova copia','Compress new copy')}</button></aside></section>`,motion);
  bindSinglePdf();
  document.querySelectorAll('[data-compression]').forEach((node)=>node.addEventListener('click',()=>{state.compression=node.dataset.compression;render('content');}));
  document.querySelector('[data-action="run-compress"]')?.addEventListener('click',runCompress);
}

function metadataFields() {
  const form=state.metadataForm;
  return [['title',t('Titolo','Title')],['author',t('Autore','Author')],['subject',t('Oggetto','Subject')],['keywords','Keywords'],['creator','Creator'],['producer','Producer']].map(([key,label])=>`<label class="form-field">${label}<input data-meta="${key}" value="${escapeAttr(form[key]||'')}"></label>`).join('');
}

function renderMetadata(motion) {
  shell(`${header(t('Informazioni documento','Document information'),'Metadata')}<section class="single-tool-grid metadata-layout"><div class="panel pdf-main-card">${state.current?`${selectedCard()}<div class="metadata-form">${metadataFields()}</div><div class="metadata-extra"><span>${t('Creazione','Created')}: <strong>${escapeHtml(state.current.creationDate||'—')}</strong></span><span>${t('Modifica','Modified')}: <strong>${escapeHtml(state.current.modificationDate||'—')}</strong></span><span>${t('Crittografia','Encryption')}: <strong>${state.current.encrypted?t('Sì','Yes'):t('No','No')}</strong></span></div>`:pdfDrop(t('Apri un PDF per leggere i metadata','Open a PDF to inspect metadata'),t('Puoi modificare i campi standard o rimuoverli dalla nuova copia.','You can edit standard fields or remove them from the new copy.'))}</div><aside class="panel pdf-controls"><h2>${t('Metadata output','Output metadata')}</h2><button class="button primary full" data-action="save-metadata" ${!state.current?'disabled':''}>${t('Salva modifiche in una copia','Save changes to a copy')}</button><button class="button secondary full" data-action="remove-metadata" ${!state.current?'disabled':''}>${t('Rimuovi metadata','Remove metadata')}</button></aside></section>`,motion);
  bindSinglePdf();
  document.querySelectorAll('[data-meta]').forEach((node)=>node.addEventListener('input',()=>{state.metadataForm[node.dataset.meta]=node.value;}));
  document.querySelector('[data-action="save-metadata"]')?.addEventListener('click',()=>runMetadata(false));
  document.querySelector('[data-action="remove-metadata"]')?.addEventListener('click',()=>runMetadata(true));
}

function renderProtect(motion) {
  shell(`${header(t('Crittografia PDF','PDF encryption'),t('Proteggi PDF','Protect PDF'))}<section class="single-tool-grid"><div class="panel pdf-main-card">${state.current?`${selectedCard()}<div class="security-form"><label class="form-field">${t('Password di apertura','Open password')}<input type="password" data-protect="open" autocomplete="new-password"></label><label class="form-field">${t('Password proprietario opzionale','Optional owner password')}<input type="password" data-protect="owner" autocomplete="new-password"></label><div class="security-note">${icons.shield}<span>${t('La password di apertura sarà necessaria per aprire la nuova copia. Conservane una copia sicura.','The open password will be required to open the new copy. Store it securely.')}</span></div></div>`:pdfDrop(t('Apri il PDF da proteggere','Open the PDF to protect'),t('La sorgente deve essere un PDF non ancora protetto.','The source must be an unprotected PDF.'))}</div><aside class="panel pdf-controls"><h2>${t('Protezione','Protection')}</h2><p>${t('La protezione PDF viene gestita interamente dal motore locale. Nessuna password viene salvata dall’app.','PDF protection is handled entirely by the local engine. Passwords are never stored by the app.')}</p><button class="button primary full" data-action="run-protect" ${!state.current?'disabled':''}>${t('Crea copia protetta','Create protected copy')}</button></aside></section>`,motion);
  bindSinglePdf();
  document.querySelector('[data-action="run-protect"]')?.addEventListener('click',runProtect);
}

function renderUnlock(motion) {
  shell(`${header(t('Rimozione protezione','Protection removal'),'Unlock PDF')}<section class="single-tool-grid"><div class="panel pdf-main-card">${state.current?`${selectedCard()}<div class="security-form"><label class="form-field">${t('Password attuale','Current password')}<input type="password" data-unlock-password autocomplete="current-password"></label><div class="security-note">${icons.shield}<span>${t('Unlock funziona soltanto quando conosci la password corretta. Non include funzioni per aggirare password sconosciute.','Unlock only works when you know the correct password. It includes no function for bypassing unknown passwords.')}</span></div></div>`:pdfDrop(t('Apri il PDF protetto','Open the protected PDF'),t('Ti verrà chiesta la password corretta per creare una copia sbloccata.','You will need the correct password to create an unlocked copy.'))}</div><aside class="panel pdf-controls"><h2>Unlock</h2><button class="button primary full" data-action="run-unlock" ${!state.current?'disabled':''}>${t('Crea copia sbloccata','Create unlocked copy')}</button></aside></section>`,motion);
  bindSinglePdf(false);
  document.querySelector('[data-action="run-unlock"]')?.addEventListener('click',runUnlock);
}

function renderConversions(motion) {
  const pdfMode=state.conversionMode==='pdfToImages';
  const pdfPages=state.current ? (state.renderPages.trim() ? parsePageExpression(state.renderPages,state.current.pages) : pageOrder(state.current.pages)) : [];
  const imageRows=state.imageFiles.map((file,index)=>`<div class="pdf-row"><span class="pdf-file-icon">${icons.image}</span><div><strong>${escapeHtml(file.name)}</strong><small>${file.width}×${file.height} · ${formatBytes(file.size)}</small></div><div class="row-actions"><button class="icon-button" data-image-move="${index}" data-dir="-1" ${index===0?'disabled':''}>${icons.up}</button><button class="icon-button" data-image-move="${index}" data-dir="1" ${index===state.imageFiles.length-1?'disabled':''}>${icons.down}</button><button class="icon-button" data-image-remove="${index}">${icons.trash}</button></div></div>`).join('');
  const pdfPanel=state.current?`${selectedCard()}<div class="conversion-fields"><label class="form-field">${t('Formato output','Output format')}<div class="conversion-pills">${[['png','PNG'],['jpg','JPG'],['webp','WebP']].map(([value,label])=>`<button class="${state.renderFormat===value?'active':''}" data-render-format="${value}">${label}</button>`).join('')}</div></label><label class="form-field">DPI<div class="conversion-pills">${[72,150,300,600].map((value)=>`<button class="${state.renderDpi===value?'active':''}" data-render-dpi="${value}">${value}</button>`).join('')}</div></label><label class="form-field">${t('Pagine','Pages')}<input data-render-pages value="${escapeAttr(state.renderPages)}" placeholder="${t('Vuoto = tutte · es. 1-4,8','Empty = all · e.g. 1-4,8')}"></label>${state.renderFormat==='jpg'?`<label class="form-field">${t('Qualità JPEG','JPEG quality')}<div class="range-field"><input type="range" min="40" max="100" value="${state.renderJpegQuality}" data-render-quality><strong>${state.renderJpegQuality}</strong></div></label>`:''}<div class="range-preview"><span>${t('Pagine da esportare','Pages to export')}</span><strong>${pdfPages.length}</strong></div></div>`:pdfDrop(t('Apri il PDF da convertire','Open the PDF to convert'),t('Esporta ogni pagina in PNG, JPG o WebP con DPI configurabili.','Export each page to PNG, JPG, or WebP at configurable DPI.'));
  const imagesPanel=state.imageFiles.length?`<div class="pdf-list">${imageRows}</div><button class="button secondary add-more" data-action="pick-images">${icons.plus}${t('Aggiungi immagini','Add images')}</button><div class="conversion-fields"><label class="form-field">${t('Formato pagina','Page size')}<div class="conversion-pills">${[['a4','A4'],['a3','A3'],['letter','Letter'],['image',t('Dimensione immagine','Image size')]].map(([value,label])=>`<button class="${state.imagePageSize===value?'active':''}" data-image-page-size="${value}">${label}</button>`).join('')}</div></label><label class="form-field">${t('Orientamento','Orientation')}<div class="conversion-pills">${[['portrait',t('Verticale','Portrait')],['landscape',t('Orizzontale','Landscape')]].map(([value,label])=>`<button class="${state.imageOrientation===value?'active':''}" data-image-orientation="${value}">${label}</button>`).join('')}</div></label><label class="form-field">${t('Margini','Margins')}<div class="range-field"><input type="range" min="0" max="40" step="1" value="${state.imageMargin}" data-image-margin><strong>${state.imageMargin} mm</strong></div></label><label class="form-field">${t('Adattamento','Placement')}<div class="conversion-pills">${[['fit','Fit'],['fill','Fill']].map(([value,label])=>`<button class="${state.imageFitMode===value?'active':''}" data-image-fit="${value}">${label}</button>`).join('')}</div></label></div>`:`<div class="drop-zone" data-drop-images><div class="drop-icon">${icons.image}</div><h2>${t('Trascina qui le immagini','Drop images here')}</h2><p>${t('JPEG, PNG, WebP, BMP e TIFF. Una pagina PDF per ogni immagine.','JPEG, PNG, WebP, BMP and TIFF. One PDF page per image.')}</p><button class="button primary" data-action="pick-images">${icons.plus}${t('Aggiungi immagini','Add images')}</button></div>`;
  shell(`${header(t('Conversioni locali','Local conversions'),t('PDF ↔ Immagini','PDF ↔ Images'))}<div class="conversion-switch"><button class="${pdfMode?'active':''}" data-conversion-mode="pdfToImages">PDF → ${t('Immagini','Images')}</button><button class="${!pdfMode?'active':''}" data-conversion-mode="imagesToPdf">${t('Immagini','Images')} → PDF</button></div><section class="single-tool-grid conversion-workspace"><div class="panel pdf-main-card">${pdfMode?pdfPanel:imagesPanel}</div><aside class="panel pdf-controls"><h2>${pdfMode?t('Esporta pagine','Export pages'):t('Crea PDF','Create PDF')}</h2><p>${pdfMode?t('Il rendering usa PDFium localmente e include annotazioni e dati dei moduli visibili.','Rendering uses PDFium locally and includes visible annotations and form data.'):t('Le immagini vengono impaginate nell’ordine mostrato. Fit mantiene tutta l’immagine, Fill riempie la pagina ritagliando l’eccesso ai bordi.','Images are laid out in the displayed order. Fit keeps the whole image, while Fill covers the page and clips overflow at the edges.')}</p><button class="button primary full" data-action="${pdfMode?'run-pdf-images':'run-images-pdf'}" ${(pdfMode?!state.current:!state.imageFiles.length)||state.busy?'disabled':''}>${state.busy?t('Elaborazione…','Processing…'):pdfMode?t('Scegli cartella ed esporta','Choose folder and export'):t('Crea PDF dalle immagini','Create PDF from images')}</button></aside></section>`,motion);
  document.querySelectorAll('[data-conversion-mode]').forEach((node)=>node.addEventListener('click',()=>{state.conversionMode=node.dataset.conversionMode;render('content');}));
  if(pdfMode){
    bindSinglePdf();
    document.querySelectorAll('[data-render-format]').forEach((node)=>node.addEventListener('click',()=>{state.renderFormat=node.dataset.renderFormat;render('content');}));
    document.querySelectorAll('[data-render-dpi]').forEach((node)=>node.addEventListener('click',()=>{state.renderDpi=Number(node.dataset.renderDpi);render('content');}));
    document.querySelector('[data-render-pages]')?.addEventListener('input',(event)=>{state.renderPages=event.target.value;});
    document.querySelector('[data-render-quality]')?.addEventListener('input',(event)=>{state.renderJpegQuality=Number(event.target.value);event.target.nextElementSibling.textContent=state.renderJpegQuality;});
    document.querySelector('[data-action="run-pdf-images"]')?.addEventListener('click',runPdfToImages);
  } else {
    document.querySelectorAll('[data-action="pick-images"]').forEach((node)=>node.addEventListener('click',pickImages));
    document.querySelectorAll('[data-image-remove]').forEach((node)=>node.addEventListener('click',()=>{state.imageFiles.splice(Number(node.dataset.imageRemove),1);render('content');}));
    document.querySelectorAll('[data-image-move]').forEach((node)=>node.addEventListener('click',()=>{const index=Number(node.dataset.imageMove);const target=index+Number(node.dataset.dir);if(target>=0&&target<state.imageFiles.length){[state.imageFiles[index],state.imageFiles[target]]=[state.imageFiles[target],state.imageFiles[index]];render('content');}}));
    document.querySelectorAll('[data-image-page-size]').forEach((node)=>node.addEventListener('click',()=>{state.imagePageSize=node.dataset.imagePageSize;render('content');}));
    document.querySelectorAll('[data-image-orientation]').forEach((node)=>node.addEventListener('click',()=>{state.imageOrientation=node.dataset.imageOrientation;render('content');}));
    document.querySelectorAll('[data-image-fit]').forEach((node)=>node.addEventListener('click',()=>{state.imageFitMode=node.dataset.imageFit;render('content');}));
    document.querySelector('[data-image-margin]')?.addEventListener('input',(event)=>{state.imageMargin=Number(event.target.value);event.target.nextElementSibling.textContent=`${state.imageMargin} mm`;});
    document.querySelector('[data-action="run-images-pdf"]')?.addEventListener('click',runImagesToPdf);
  }
}

async function pickImages() {
  if(!isTauri) return toast(t('Apri l’app desktop per selezionare immagini reali.','Open the desktop app to select real images.'),'warning');
  const result=await open({multiple:true,filters:[{name:t('Immagini','Images'),extensions:['jpg','jpeg','png','webp','bmp','tif','tiff']}]});
  const paths=Array.isArray(result)?result:result?[result]:[];
  if(paths.length) await addImagePaths(paths);
}

async function addImagePaths(paths) {
  const existing=new Set(state.imageFiles.map((file)=>file.path));
  const fresh=paths.filter((path)=>!existing.has(path));
  if(!fresh.length) return;
  const info=await invoke('inspect_image_files',{paths:fresh});
  state.imageFiles.push(...info);
  render('content');
}

async function runPdfToImages() {
  const outputDir=await open({directory:true,multiple:false});
  if(!outputDir) return;
  const pages=state.renderPages.trim()?parsePageExpression(state.renderPages,state.current.pages):[];
  if(state.renderPages.trim()&&!pages.length) return toast(t('Intervallo pagine non valido.','Invalid page range.'),'warning');
  await withBusy(async()=>{const outputs=await invoke('render_pdf_pages',{path:state.current.path,outputDir,format:state.renderFormat,dpi:state.renderDpi,pages,password:null,jpegQuality:state.renderJpegQuality});logActivity('pdfImages',outputs.length);toast(t(`${outputs.length} immagini create.`,`${outputs.length} images created.`));});
}

async function runImagesToPdf() {
  const output=await save({defaultPath:'images.pdf',filters:[{name:'PDF',extensions:['pdf']}]});
  if(!output) return;
  const options={pageSize:state.imagePageSize,orientation:state.imageOrientation,marginMm:state.imageMargin,fitMode:state.imageFitMode};
  await withBusy(async()=>{const result=await invoke('images_to_pdf',{paths:state.imageFiles.map((file)=>file.path),outputPath:output,options});logActivity('imagesPdf',state.imageFiles.length);toast(`${t('Creato','Created')}: ${basename(result)}`);});
}

function renderActivity(motion) {
  shell(`${header(t('Registro locale','Local log'),t('Attività','Activity'))}<section class="panel activity-page">${state.activity.length?state.activity.map((item)=>`<div class="activity-item"><div><strong>${activityTitle(item)}</strong><span>${new Intl.DateTimeFormat(state.settings.language==='en'?'en-US':'it-IT',{dateStyle:'medium',timeStyle:'short'}).format(new Date(item.timestamp))}</span></div><span class="status ready">${t('Completato','Completed')}</span></div>`).join(''):`<div class="empty-mini"><h2>${t('Nessuna attività','No activity yet')}</h2><p>${t('Le operazioni completate appariranno qui.','Completed operations will appear here.')}</p></div>`}</section>`,motion);
}

function activityTitle(item) {
  const labels={merge:[t('PDF unito','PDF merged')],split:[t(`${item.count||0} PDF creati`,`${item.count||0} PDFs created`)],pages:[t('Pagine riorganizzate','Pages reorganized')],compress:[t('PDF compresso','PDF compressed')],metadata:[t('Metadata aggiornati','Metadata updated')],protect:[t('PDF protetto','PDF protected')],unlock:[t('PDF sbloccato','PDF unlocked')],pdfImages:[t(`${item.count||0} immagini esportate`,`${item.count||0} images exported`)],imagesPdf:[t(`PDF creato da ${item.count||0} immagini`,`PDF created from ${item.count||0} images`)]};
  return labels[item.type]?.[0] || t('Operazione PDF','PDF operation');
}

function renderSettings(motion) {
  shell(`${header('_davPDF',t('Impostazioni','Settings'))}<section class="settings-grid"><div class="panel settings-card"><h2>${t('Aspetto','Appearance')}</h2><div class="setting-control"><span class="setting-control-label">${t('Tema','Theme')}</span>${davSelect('theme',state.settings.theme,[['system',t('Sistema','System')],['light',t('Chiaro','Light')],['dark',t('Scuro','Dark')]])}</div><div class="setting-control"><span class="setting-control-label">${t('Lingua','Language')}</span>${davSelect('language',state.settings.language,[['it','Italiano'],['en','English']])}</div></div><div class="panel about-card"><div class="brand big"><span>_dav</span>PDF</div><p>${t('Toolbox PDF locale e multipiattaforma. Nessun account, nessuna pubblicità e nessun upload dei tuoi documenti.','Local cross-platform PDF toolbox. No account, no ads, and no document uploads.')}</p><div class="about-links"><button class="website-button" data-action="website">${icons.globe}<span>davstudios.it</span></button><button class="coffee-button wide" data-action="coffee">${icons.coffee}<span>${t('Comprami Un Caffè','Buy Me A Coffee')}</span></button></div><div class="version">${state.appVersion ? `v${escapeHtml(state.appVersion)} · ` : ''}${t('Release stabile','Stable release')}</div></div><div class="panel feature-status-card"><h2>${t('Stato funzionalità','Feature status')}</h2><div><strong>${t('Disponibile','Available')}</strong><span>Merge · Split · Page Manager · Compress · Metadata · Protect · Unlock · PDF → Images · Images → PDF · Page thumbnails</span></div><div><strong>${t('Motore rendering','Rendering engine')}</strong><span>PDFium · ${t('elaborazione completamente locale','fully local processing')}</span></div></div></section>`,motion);
  bindSettings();
}

function davSelect(id,value,options) {
  const current=options.find(([key])=>key===value)||options[0];
  return `<div class="dav-select" data-dav-select="${id}"><button class="dav-select-trigger" type="button" aria-expanded="false"><span>${escapeHtml(current[1])}</span><span class="dav-select-chevron">${icons.chevron}</span></button><div class="dav-select-menu">${options.map(([key,label])=>`<button class="dav-select-option ${key===value?'is-selected':''}" data-value="${key}"><span>${escapeHtml(label)}</span><span class="dav-select-check">${icons.check}</span></button>`).join('')}</div></div>`;
}

function bindSettings() {
  document.querySelectorAll('.dav-select-trigger').forEach((node)=>node.addEventListener('click',()=>{const select=node.closest('.dav-select');document.querySelectorAll('.dav-select.is-open').forEach((other)=>{if(other!==select)other.classList.remove('is-open');});select.classList.toggle('is-open');}));
  document.querySelectorAll('.dav-select-option').forEach((node)=>node.addEventListener('click',()=>{const select=node.closest('.dav-select');const key=select.dataset.davSelect;const value=node.dataset.value;runUiTransition(key==='theme'?'theme':'language',()=>{state.settings[key]=value;persistSettings();render();});}));
}

function bindGlobal() {
  document.querySelectorAll('[data-page]').forEach((node)=>node.addEventListener('click',()=>{state.page=node.dataset.page;render('page');}));
  document.querySelectorAll('[data-action="coffee"]').forEach((node)=>node.addEventListener('click',()=>openExternal('https://buymeacoffee.com/davstudios')));
  document.querySelectorAll('[data-action="website"]').forEach((node)=>node.addEventListener('click',()=>openExternal(state.settings.language==='en'?'https://www.davstudios.it/en':'https://www.davstudios.it')));
  document.querySelectorAll('[data-action="theme"]').forEach((node)=>node.addEventListener('click',()=>{const next=resolvedTheme()==='dark'?'light':'dark';runUiTransition('theme',()=>{state.settings.theme=next;persistSettings();render();});}));
}

async function openExternal(url) {
  if (isTauri) await openUrl(url);
  else window.open(url,'_blank','noopener,noreferrer');
}

async function pickPdf(multiple=false) {
  if (!isTauri) return toast(t('Apri l’app desktop per selezionare file reali.','Open the desktop app to select real files.'),'warning');
  const result=await open({multiple,filters:[{name:'PDF',extensions:['pdf']}]});
  const paths=Array.isArray(result)?result:result?[result]:[];
  if (!paths.length) return;
  await addPdfPaths(paths,multiple);
}

async function addPdfPaths(paths,multiple) {
  if (!multiple) {
    const info=await inspect(paths[0]);
    state.current=info;
    state.files=[info];
    state.pageOrder=pageOrder(info.pages);
    state.rotations={};
    state.pageThumbnails={};
    state.metadataForm={title:info.title||'',author:info.author||'',subject:info.subject||'',keywords:info.keywords||'',creator:info.creator||'',producer:info.producer||''};
  } else {
    const existing=new Set(state.files.map((file)=>file.path));
    for (const path of paths) if (!existing.has(path)) state.files.push(await inspect(path));
  }
  render('content');
}

async function inspect(path,password='') {
  return invoke('inspect_pdf',{path,password:password||null});
}

function bindFileWorkspace(multiple) {
  document.querySelectorAll('[data-action="pick-pdf"]').forEach((node)=>node.addEventListener('click',()=>pickPdf(node.dataset.multiple==='true'||multiple)));
  document.querySelector('[data-action="clear-files"]')?.addEventListener('click',()=>{state.files=[];render('content');});
  document.querySelectorAll('[data-remove-file]').forEach((node)=>node.addEventListener('click',()=>{state.files.splice(Number(node.dataset.removeFile),1);render('content');}));
  document.querySelectorAll('[data-move-file]').forEach((node)=>node.addEventListener('click',()=>{const index=Number(node.dataset.moveFile);const target=index+Number(node.dataset.dir);[state.files[index],state.files[target]]=[state.files[target],state.files[index]];render('content');}));
}

function bindSinglePdf() {
  document.querySelectorAll('[data-action="pick-pdf"],[data-action="replace-pdf"]').forEach((node)=>node.addEventListener('click',()=>pickPdf(false)));
}

async function chooseOutput(operation) {
  const name=outputName(state.current?.name||state.files[0]?.name||'document.pdf',operation);
  return save({defaultPath:name,filters:[{name:'PDF',extensions:['pdf']}]});
}

function logActivity(type,count=1) {
  state.activity.unshift({type,count,timestamp:new Date().toISOString()});
  persistActivity();
}

async function runMerge() {
  const output=await save({defaultPath:'merged.pdf',filters:[{name:'PDF',extensions:['pdf']}]});
  if (!output) return;
  await withBusy(async()=>{const result=await invoke('merge_pdfs',{paths:state.files.map((file)=>file.path),outputPath:output});logActivity('merge');toast(`${t('Creato','Created')}: ${basename(result)}`);});
}

async function runSplit() {
  const groups=splitGroups(state.splitMode,state.current.pages,state.splitExpression,state.splitEvery);
  const outputDir=await open({directory:true,multiple:false});
  if (!outputDir) return;
  await withBusy(async()=>{const outputs=await invoke('split_pdf',{path:state.current.path,outputDir,groups,password:null});logActivity('split',outputs.length);toast(t(`${outputs.length} PDF creati.`,`${outputs.length} PDFs created.`));});
}

async function runPages() {
  const output=await chooseOutput('pages');
  if (!output) return;
  const rotations=Object.entries(state.rotations).map(([page,degrees])=>({page:Number(page),degrees:Number(degrees)}));
  await withBusy(async()=>{const result=await invoke('reorder_rotate_pages',{path:state.current.path,outputPath:output,order:state.pageOrder,rotations,password:null});logActivity('pages');toast(`${t('Creato','Created')}: ${basename(result)}`);});
}

async function runCompress() {
  const output=await chooseOutput('compress');
  if (!output) return;
  await withBusy(async()=>{const result=await invoke('compress_pdf',{path:state.current.path,outputPath:output,compressionLevel:estimatedCompressionLevel(state.compression),password:null});logActivity('compress');toast(`${t('Creato','Created')}: ${basename(result)}`);});
}

async function runMetadata(removeAll) {
  const output=await chooseOutput('metadata');
  if (!output) return;
  const update={...state.metadataForm,removeAll};
  await withBusy(async()=>{const result=await invoke('update_metadata',{path:state.current.path,outputPath:output,update,password:null});logActivity('metadata');toast(`${t('Creato','Created')}: ${basename(result)}`);});
}

async function runProtect() {
  const openPassword=document.querySelector('[data-protect="open"]')?.value||'';
  const ownerPassword=document.querySelector('[data-protect="owner"]')?.value||'';
  if (!openPassword) return toast(t('Inserisci una password di apertura.','Enter an open password.'),'warning');
  const output=await chooseOutput('protect');
  if (!output) return;
  await withBusy(async()=>{const result=await invoke('protect_pdf',{path:state.current.path,outputPath:output,openPassword,ownerPassword});logActivity('protect');toast(`${t('Creato','Created')}: ${basename(result)}`);});
}

async function runUnlock() {
  const password=document.querySelector('[data-unlock-password]')?.value||'';
  if (!password) return toast(t('Inserisci la password attuale.','Enter the current password.'),'warning');
  const output=await chooseOutput('unlock');
  if (!output) return;
  await withBusy(async()=>{const result=await invoke('unlock_pdf',{path:state.current.path,outputPath:output,password});logActivity('unlock');toast(`${t('Creato','Created')}: ${basename(result)}`);});
}

async function withBusy(task) {
  if (state.busy) return;
  state.busy=true;
  render();
  try { await task(); }
  catch (error) { toast(String(error), 'warning'); }
  finally { state.busy=false; render('content'); }
}

function toast(text,kind='success') {
  const region=document.querySelector('#toast-region');
  if (!region) return;
  const node=document.createElement('div');
  node.className=`toast ${kind}`;
  node.textContent=text;
  region.append(node);
  setTimeout(()=>{node.classList.add('is-leaving');setTimeout(()=>node.remove(),190);},3200);
}

if (isTauri) {
  getCurrentWebview().onDragDropEvent(async(event)=>{
    const paths=event.payload?.paths||[];
    if (event.payload?.type==='enter') { document.querySelector('[data-drop-pdf]')?.classList.add('drag-over'); document.querySelector('[data-drop-images]')?.classList.add('drag-over'); }
    if (event.payload?.type==='leave') { document.querySelector('[data-drop-pdf]')?.classList.remove('drag-over'); document.querySelector('[data-drop-images]')?.classList.remove('drag-over'); }
    if (event.payload?.type==='drop') {
      document.querySelector('[data-drop-pdf]')?.classList.remove('drag-over');
      document.querySelector('[data-drop-images]')?.classList.remove('drag-over');
      if(state.page==='images'&&state.conversionMode==='imagesToPdf') {
        const images=paths.filter((path)=>/\.(jpe?g|png|webp|bmp|tiff?)$/i.test(path));
        if(images.length) await addImagePaths(images);
        return;
      }
      const pdfs=paths.filter((path)=>path.toLowerCase().endsWith('.pdf'));
      if (!pdfs.length) return;
      await addPdfPaths(pdfs,state.page==='merge');
    }
  });
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(state.settings.theme==='system'){applyTheme();render();}});

async function initializeApp() {
  try {
    state.appVersion = await getVersion();
  } catch {
    state.appVersion = '';
  }
  render('startup');
}

initializeApp();

