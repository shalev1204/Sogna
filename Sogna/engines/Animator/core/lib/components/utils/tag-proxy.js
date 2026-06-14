export function tagProxy(createComponent) {
    const cache = new Map();
    return new Proxy(createComponent, {
        get: (_, key) => {
            if (!cache.has(key))
                cache.set(key, createComponent(key));
            return cache.get(key);
        },
    });
}
//# sourceMappingURL=tag-proxy.js.map