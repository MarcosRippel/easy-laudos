/**
 * Service Worker para Interface Unificada de Canhotos
 * Fornece cache inteligente e otimizações de performance
 */

const CACHE_NAME = 'canhoto-unificado-v1.0.0';
const DYNAMIC_CACHE = 'canhoto-dynamic-v1.0.0';

// Recursos estáticos para cache
const STATIC_ASSETS = [
    '/static/css/bootstrap.min.css',
    '/static/js/bootstrap.bundle.min.js',
    '/static/js/preview-manager-unified.js',
    '/templates/form_canhoto_multiplo_novo.html'
];

// Recursos da API para cache dinâmico
const API_ROUTES = [
    '/api/search-context',
    '/api/upload-files-unified',
    '/api/gpt-analysis-unified',
    '/api/process-canhotos-unified'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    console.log('[SW] Instalando Service Worker');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cache aberto');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] Ativando Service Worker');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE) {
                        console.log('[SW] Removendo cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Estratégia para recursos estáticos
    if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
        event.respondWith(cacheFirst(request));
        return;
    }
    
    // Estratégia para APIs
    if (API_ROUTES.some(route => request.url.includes(route))) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // Estratégia para imagens
    if (request.destination === 'image') {
        event.respondWith(cacheFirst(request));
        return;
    }
    
    // Estratégia padrão
    event.respondWith(networkFirst(request));
});

// Estratégia Cache First (para recursos estáticos)
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            // Atualizar cache em background
            updateCache(request);
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        await cacheResponse(request, networkResponse.clone());
        return networkResponse;
        
    } catch (error) {
        console.error('[SW] Erro em cacheFirst:', error);
        return caches.match('/offline.html') || new Response('Offline');
    }
}

// Estratégia Network First (para APIs)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache apenas respostas de sucesso
        if (networkResponse.ok) {
            await cacheResponse(request, networkResponse.clone(), DYNAMIC_CACHE);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('[SW] Rede indisponível, tentando cache');
        
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Resposta offline para APIs
        if (request.url.includes('/api/')) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Sem conexão com a internet',
                    offline: true 
                }),
                {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        return new Response('Sem conexão com a internet', { status: 503 });
    }
}

// Cache response helper
async function cacheResponse(request, response, cacheName = CACHE_NAME) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
}

// Update cache in background
async function updateCache(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cacheResponse(request, response);
        }
    } catch (error) {
        console.log('[SW] Falha ao atualizar cache:', error);
    }
}

// Background sync para uploads
self.addEventListener('sync', event => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'upload-canhotos') {
        event.waitUntil(syncUploads());
    }
});

// Sync de uploads quando voltar online
async function syncUploads() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        
        const uploadRequests = requests.filter(request => 
            request.url.includes('/api/upload-files-unified') ||
            request.url.includes('/api/process-canhotos-unified')
        );
        
        for (const request of uploadRequests) {
            try {
                await fetch(request.clone());
                await cache.delete(request);
                console.log('[SW] Upload sincronizado:', request.url);
            } catch (error) {
                console.error('[SW] Falha na sincronização:', error);
            }
        }
    } catch (error) {
        console.error('[SW] Erro no background sync:', error);
    }
}

// Push notifications para status de processamento
self.addEventListener('push', event => {
    if (!event.data) return;
    
    try {
        const data = event.data.json();
        
        const options = {
            body: data.message || 'Processamento de canhotos atualizado',
            icon: '/static/img/icon-192.png',
            badge: '/static/img/badge-72.png',
            data: data,
            actions: [
                {
                    action: 'view',
                    title: 'Ver Detalhes'
                },
                {
                    action: 'dismiss',
                    title: 'Dispensar'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'Canhotos', options)
        );
    } catch (error) {
        console.error('[SW] Erro ao processar push:', error);
    }
});

// Click em notificações
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/enviar-canhoto-multiplo?nova_interface=1')
        );
    }
});

// Message handling
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'CACHE_URLS':
            event.waitUntil(cacheUrls(data.urls));
            break;
        case 'CLEAR_CACHE':
            event.waitUntil(clearCache(data.cacheName));
            break;
        case 'GET_CACHE_SIZE':
            event.waitUntil(getCacheSize().then(size => {
                event.ports[0].postMessage({ size });
            }));
            break;
    }
});

// Cache URLs sob demanda
async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
            }
        } catch (error) {
            console.error('[SW] Erro ao cachear URL:', url, error);
        }
    }
}

// Limpar cache específico
async function clearCache(cacheName) {
    return caches.delete(cacheName || DYNAMIC_CACHE);
}

// Obter tamanho do cache
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}

console.log('[SW] Service Worker carregado para Interface Unificada de Canhotos');
