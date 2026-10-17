(() => {
  'use strict';
  const cfg=window.SNACK_ANALYTICS || {};
  const consentKey='quick-snack-analytics-v1';
  let consent=''; try { consent=localStorage.getItem(consentKey)||''; } catch (_) {}
  const configured=!!(cfg.liveInternet || /^\d+$/.test(cfg.ramblerId||'') || /^\d+$/.test(cfg.mailId||''));
  const enabled=[];
  let started=false;
  function script(src,id) { if (document.getElementById(id)) return; const s=document.createElement('script');s.async=true;s.src=src;s.id=id;document.head.appendChild(s); }
  function badge(name,url,href) {
    if (!url) return; let parsed; try { parsed=new URL(url); } catch (_) { return; }
    if (parsed.protocol!=='https:') return;
    const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';
    const img=document.createElement('img');img.src=url;img.alt=name+' — статистика сайта';img.width=88;img.height=31;
    a.appendChild(img);document.getElementById('analytics-badges').appendChild(a);
  }
  function start() {
    if (started || consent!=='accepted') return; started=true;
    if (cfg.liveInternet) {
      enabled.push('LiveInternet');
      // The supplied t52.6 image both records the pageview and displays totals.
      // Do not add a separate tracking pixel: it would count the page twice.
      const link=document.createElement('a');
      link.href='https://www.liveinternet.ru/click';
      link.target='_blank';link.rel='noopener noreferrer';
      const counter=document.createElement('img');
      counter.id='licnt82FE';counter.width=88;counter.height=31;
      counter.style.border='0';
      counter.title='LiveInternet: показано число просмотров и посетителей за 24 часа';
      counter.alt='LiveInternet — просмотры и посетители за 24 часа';
      counter.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7';
      link.appendChild(counter);document.getElementById('analytics-badges').appendChild(link);
      const s=window.screen;
      counter.src='https://counter.yadro.ru/hit?t52.6;r'+escape(document.referrer)+
        (typeof(s)==='undefined'?'':';s'+s.width+'*'+s.height+'*'+(s.colorDepth?s.colorDepth:s.pixelDepth))+
        ';u'+escape(document.URL)+';h'+escape(document.title.substring(0,150))+';'+Math.random();
    }
    if (/^\d+$/.test(cfg.ramblerId||'')) {
      enabled.push('Рамблер/Топ-100');
      window._top100q=window._top100q||[];
      window._top100q.push(function () {
        try { window.top100Counter=new window.top100({project:Number(cfg.ramblerId)});
          if (!cfg.badges?.rambler) { const slot=document.createElement('span');slot.id='rambler-badge';document.getElementById('analytics-badges').appendChild(slot);window.top100Counter.drawLogoTo('rambler-badge'); }
        } catch (err) { console.warn('Не удалось запустить счётчик Топ-100',err); }
      });
      script('https://st.top100.ru/top100/top100.js','rambler-counter');
      badge('Рамблер/Топ-100',cfg.badges?.rambler,'https://top100.rambler.ru/navi/');
    }
    if (/^\d+$/.test(cfg.mailId||'')) {
      enabled.push('Рейтинг Mail.ru');
      window._tmr=window._tmr||[];
      window._tmr.push({id:cfg.mailId,type:'pageView',start:Date.now()});
      script('https://top-fwz1.mail.ru/js/code.js','tmr-code');
      badge('Рейтинг Mail.ru',cfg.badges?.mail,'https://top-fwz1.mail.ru/jump?from='+encodeURIComponent(cfg.mailId));
    }
  }
  // Only actions occurring after permission are sent. Past actions are not replayed.
  window.snackTrack=(name,params={})=>{
    if (consent!=='accepted' || !started || !['favoriteAdd','timerStart'].includes(name)) return;
    if (/^\d+$/.test(cfg.mailId||'')) window._tmr.push({id:cfg.mailId,type:'reachGoal',goal:name,params});
    if (/^\d+$/.test(cfg.ramblerId||'')) {
      if (window.top100Counter) window.top100Counter.trackEvent(name,params);
      else window._top100q.push(function(){window.top100Counter?.trackEvent(name,params);});
    }
  };
  const dialog=document.getElementById('privacy-dialog'),banner=document.getElementById('consent-banner');
  if (configured && !consent) banner.hidden=false;
  document.querySelectorAll('[data-privacy-open]').forEach(b=>b.addEventListener('click',()=>dialog.showModal()));
  document.querySelector('[data-privacy-close]')?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('click',ev=>{if(ev.target===dialog){const r=dialog.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)dialog.close();}});
  document.querySelectorAll('[data-privacy-choice]').forEach(b=>b.addEventListener('click',()=>{
    const previous=consent;consent=b.dataset.privacyChoice;
    try { localStorage.setItem(consentKey,consent); } catch (_) {}
    banner.hidden=true;dialog.close();
    if (previous==='accepted' && consent!=='accepted' && started) {location.reload();return;}
    start();
  }));
  start();
  const info=document.getElementById('privacy-services');
  if (info && configured) { const names=[];if(cfg.liveInternet)names.push('LiveInternet');if(cfg.ramblerId)names.push('Рамблер/Топ-100');if(cfg.mailId)names.push('Рейтинг Mail.ru');info.textContent='На сайте настроены: '+names.join(', ')+'. Они загружаются только после вашего разрешения.'; }
})();
