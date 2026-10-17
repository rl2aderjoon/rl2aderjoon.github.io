const list = document.querySelector('#map-list');
const filters = document.querySelector('#filters');
const toast = document.querySelector('#toast');
const dialog = document.querySelector('#preview');
let catalog = [], currentFilter = 'all', toastTimer, counts = {};
const releaseTag = 'maps-2026-10-v4';
const countTags = ['maps-2026-10', 'maps-2026-10-v2', 'maps-2026-10-v3', releaseTag];
const releaseBase = `https://github.com/rl2aderjoon/rl2aderjoon.github.io/releases/download/${releaseTag}`;

const downloadIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/></svg>';
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
async function loadCounts() {
  const key = `gabolle-counts-${releaseTag}`;
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (cached && Date.now()-cached.time < 300000) {counts=cached.counts;render();return;}
  } catch {}
  try {
    const releases=await Promise.all(countTags.map(async tag=>{
      const response=await fetch(`https://api.github.com/repos/rl2aderjoon/rl2aderjoon.github.io/releases/tags/${tag}`,{signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw new Error('counts unavailable');
      return response.json();
    }));
    for(const map of catalog){
      const assets=releases.map(release=>release.assets.find(a=>a.name===`${map.id}.png`));
      if(assets.every(asset=>asset && Number.isSafeInteger(asset.download_count)))counts[map.id]=assets.reduce((sum,asset)=>sum+asset.download_count,0);
    }
    try{localStorage.setItem(key,JSON.stringify({time:Date.now(),counts}));}catch{}
    render();
  } catch { /* Downloads use stable release URLs even when statistics are unavailable. */ }
}
function notify(message) {
  toast.textContent = message;toast.hidden = false;
  clearTimeout(toastTimer);toastTimer = setTimeout(() => {toast.hidden = true;}, 5000);
}
function downloadLink(map, location) {
  return `<a class="download" href="${releaseBase}/${map.id}.png" download="gabolle-${map.id}.png" data-download="${map.id}" data-location="${location}" aria-label="${map.name} 지도 PNG 다운로드">${downloadIcon}<span>PNG 받기</span></a>`;
}
function render() {
  const query = document.querySelector('#search').value.trim().toLowerCase();
  const displayed = catalog.filter(map => (currentFilter === 'all' || (currentFilter === 'city' ? ['seoul','busan','daegu','incheon','gwangju','daejeon','ulsan','sejong'].includes(map.id) : !['seoul','busan','daegu','incheon','gwangju','daejeon','ulsan','sejong','korea'].includes(map.id))) && (!query || `${map.name} ${map.english}`.toLowerCase().includes(query)));
  list.innerHTML = displayed.length ? displayed.map(map => `<li class="map-row"><button class="map-open" data-preview="${map.id}" aria-label="${map.name} 지도 미리보기"><span class="row-index">${String(catalog.indexOf(map)+1).padStart(2,'0')}</span><img class="thumbnail" src="assets/maps/${map.id}-thumb.svg?v=7" alt="" loading="lazy" width="72" height="72"><span class="city-title">${map.name}<span class="city-en">${map.english}</span></span><span class="area-count">${map.areas}개 ${map.grouped ? '권역' : '지역'}</span></button><span class="download-count" title="GitHub 파일 다운로드 횟수 · 반복 다운로드 포함">${counts[map.id] === undefined ? '—' : counts[map.id].toLocaleString('ko-KR')}<span> 다운로드</span></span>${downloadLink(map,'list')}</li>`).join('') : '<li class="empty">찾는 지역이 없어요. 다른 이름으로 검색해 보세요.</li>';
}
function openPreview(map, updateUrl=true) {
  document.querySelector('#preview-title').textContent = `${map.name} 트친 어디 살아?`;
  const image = document.querySelector('#preview-image');
  image.src = `assets/maps/${map.id}.svg?v=7`;image.alt = `${map.name} 번호별 만남 지도`;
  document.querySelector('#preview-download').innerHTML = downloadLink(map,'preview');
  document.querySelector('#preview-note').textContent = map.grouped ? '번호별 묶음은 공유를 위한 구분이며 공식 생활권이 아닙니다.' : '행정구역을 단순화한 공유용 지도입니다.';
  document.querySelector('#preview-legend').innerHTML = map.legend.map(item => `<li><span style="background:${item.color}">${item.number}</span>${escapeHtml(item.name)}</li>`).join('');
  if(!dialog.open) dialog.showModal();
  if(updateUrl) {const url=new URL(location.href);url.searchParams.set('map',map.id);history.replaceState(null,'',url);}
}
dialog.addEventListener('close',() => {const url=new URL(location.href);url.searchParams.delete('map');history.replaceState(null,'',url);});
document.querySelector('#close-preview').addEventListener('click',() => dialog.close());
dialog.addEventListener('click',event => {if(event.target===dialog) dialog.close();});
document.addEventListener('click',event => {
  const preview=event.target.closest('[data-preview]');
  if(preview) {const map=catalog.find(m=>m.id===preview.dataset.preview);if(map)openPreview(map);}
  const download=event.target.closest('[data-download]');
  if(download) {
    const map=catalog.find(m=>m.id===download.dataset.download);
    if(map) notify(`${map.name} 지도 저장을 요청했어요. 앱 안에서 열었다면 브라우저로 열어 저장해 주세요.`);
  }
});
filters.addEventListener('click',event => {
  const button=event.target.closest('[data-filter]');if(!button)return;
  currentFilter=button.dataset.filter;
  filters.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));render();
});
document.querySelector('#search').addEventListener('input',render);
document.querySelector('#theme-toggle').addEventListener('click',() => {
  const dark=document.documentElement.dataset.theme!=='dark';
  document.documentElement.dataset.theme=dark?'dark':'light';
  document.querySelector('#theme-toggle').setAttribute('aria-label',dark?'밝은 테마로 바꾸기':'어두운 테마로 바꾸기');
  try{localStorage.setItem('gabolle-theme',dark?'dark':'light');}catch{}
});
fetch('assets/maps/catalog.json?v=7').then(response=>{if(!response.ok)throw new Error('catalog');return response.json();}).then(data=>{
  catalog=data;render();loadCounts();
  const selected=catalog.find(map=>map.id===new URL(location.href).searchParams.get('map'));if(selected)openPreview(selected,false);
}).catch(()=>{list.innerHTML='<li class="empty">지도 목록을 불러오지 못했어요. 새로고침하거나 <a href="https://github.com/rl2aderjoon/rl2aderjoon.github.io/releases/download/maps-2026-10-v4/seoul.png" download>서울 지도</a> · <a href="https://github.com/rl2aderjoon/rl2aderjoon.github.io/releases/download/maps-2026-10-v4/busan.png" download>부산 지도</a>를 바로 받아주세요.</li>';});
