var C='allowance-diary-v3',A=['./','index.html','style.css','app.js','manifest.json','firebase-config.js','icon-192.png','icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(A)}));self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
 if(e.request.method!=='GET')return;
 e.respondWith(fetch(e.request).then(function(n){
  if(new URL(e.request.url).origin===location.origin){var cp=n.clone();caches.open(C).then(function(c){c.put(e.request,cp)})}
  return n}).catch(function(){return caches.match(e.request).then(function(r){return r||caches.match('index.html')})}))});
