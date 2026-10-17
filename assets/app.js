(() => {
  'use strict';
  const key = 'quick-snack-favorites-v1';
  const allIds = new Set(Array.from(document.querySelectorAll('[data-favorite]'), b => b.dataset.favorite));
  // Each page only contains a subset of cards; validate stored slugs, not page membership.
  let favorites = new Set();
  try { const saved = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(saved)) favorites = new Set(saved.filter(x => typeof x === 'string' && /^[a-z-]+$/.test(x))); } catch (_) {}
  let toastTimeout;
  const notify = message => { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => el.classList.remove('visible'), 3000); };
  const persist = () => { try { localStorage.setItem(key, JSON.stringify([...favorites])); } catch (_) { notify('Хранилище браузера недоступно: список сохранится только до закрытия страницы.'); } };
  const update = () => {
    document.querySelectorAll('[data-favorite-count]').forEach(el => el.textContent = favorites.size);
    document.querySelectorAll('[data-favorite]').forEach(b => {
      const yes = favorites.has(b.dataset.favorite);
      b.setAttribute('aria-pressed', String(yes));
      if (b.classList.contains('save-button')) {
        const title = b.closest('.recipe-card').querySelector('h3').textContent;
        b.setAttribute('aria-label', (yes ? 'Убрать из избранного: ' : 'Сохранить рецепт: ') + title);
      }
      const label = b.querySelector('[data-save-label]'); if (label) label.textContent = yes ? 'В избранном' : 'Сохранить рецепт';
    });
    if (document.getElementById('favorites-page')) {
      let visible = 0;
      document.querySelectorAll('[data-recipe-card]').forEach(c => { c.hidden = !favorites.has(c.dataset.recipeCard); if (!c.hidden) visible++; });
      document.getElementById('favorites-empty').hidden = visible !== 0;
      document.getElementById('clear-favorites').hidden = visible === 0;
    }
  };
  document.querySelectorAll('[data-favorite]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.favorite;
    if (favorites.has(id)) { favorites.delete(id); notify('Рецепт убран из избранного'); }
    else { favorites.add(id); notify('Рецепт сохранён в избранном'); window.snackTrack?.('favoriteAdd', { recipe: id }); }
    persist(); update();
  }));
  document.getElementById('clear-favorites')?.addEventListener('click', () => { favorites.clear(); persist(); update(); notify('Избранное очищено'); });
  window.addEventListener('storage', ev => { if (ev.key !== key) return; try { const value=JSON.parse(ev.newValue || '[]'); favorites=new Set(Array.isArray(value) ? value.filter(x=>typeof x==='string' && /^[a-z-]+$/.test(x)) : []); update(); } catch (_) {} });
  update();
  const search=document.getElementById('recipe-search');
  let maxTime=Infinity;
  const filter = () => {
    if (!search) return;
    const query=search.value.toLocaleLowerCase('ru').trim().replace(/ё/g,'е'); let count=0;
    document.querySelectorAll('[data-recipe-card]').forEach(card => { card.hidden=!(card.dataset.title.replace(/ё/g,'е').includes(query) && Number(card.dataset.minutes)<=maxTime); if (!card.hidden) count++; });
    const suffix=count%10===1 && count%100!==11 ? 'рецепт' : count%10>=2 && count%10<=4 && !(count%100>=12 && count%100<=14) ? 'рецепта' : 'рецептов';
    document.getElementById('result-count').textContent=`${count} ${suffix}`;
    document.getElementById('search-empty').hidden=count>0;
  };
  search?.addEventListener('input', filter);
  document.querySelectorAll('[data-time]').forEach(button => button.addEventListener('click', () => { maxTime=button.dataset.time==='all' ? Infinity : Number(button.dataset.time); document.querySelectorAll('[data-time]').forEach(b=>b.setAttribute('aria-pressed',String(b===button))); filter(); }));
  document.querySelector('[data-reset-search]')?.addEventListener('click', () => { search.value=''; maxTime=Infinity; document.querySelectorAll('[data-time]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.time==='all'))); filter(); search.focus(); });
  const timer = document.querySelector('[data-timer-seconds]');
  if (timer) {
    const total=Number(timer.dataset.timerSeconds), display=document.getElementById('timer-display'), toggle=document.getElementById('timer-toggle'), status=document.getElementById('timer-status');
    let remaining=total, deadline=0, handle=null, counted=false;
    const paint=()=>{ display.textContent=`${Math.floor(remaining/60).toString().padStart(2,'0')}:${(remaining%60).toString().padStart(2,'0')}`; };
    const tick=()=>{ remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000)); paint(); if (!remaining) { clearInterval(handle);handle=null;toggle.textContent='Запустить снова';status.textContent='Время вышло. Проверьте готовность блюда.';notify('Таймер завершён — проверьте блюдо'); } };
    toggle.addEventListener('click',()=>{
      if (handle) { remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));clearInterval(handle);handle=null;paint();toggle.textContent='Продолжить';status.textContent='Таймер на паузе';return; }
      if (remaining===0) { remaining=total; counted=false; }
      deadline=Date.now()+remaining*1000;handle=setInterval(tick,250);toggle.textContent='Пауза';status.textContent='Таймер работает, пока эта страница открыта';
      if (!counted) { window.snackTrack?.('timerStart',{recipe:location.pathname.split('/').pop().replace('.html',''),seconds:total});counted=true; }
    });
    document.getElementById('timer-reset').addEventListener('click',()=>{clearInterval(handle);handle=null;remaining=total;counted=false;paint();toggle.textContent='Запустить таймер';status.textContent='';});
    document.addEventListener('visibilitychange',()=>{if(handle)tick();});
  }
})();
