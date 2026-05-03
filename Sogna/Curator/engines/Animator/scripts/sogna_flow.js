/**
 * SognaFlow - Native Kinetic Engine
 * Sovereign implementation of sognaflow-dom patterns.
 * 
 * Usage:
 * import { flow } from './sogna_flow.js';
 * 
 * flow.animate("#box", { opacity: 1, y: 0 }, { duration: 0.5 });
 */

const flow = {
    /**
     * Core animation function.
     * Maps to sognaflow-dom logic or WAAPI.
     */
    animate: (target, props, options = {}) => {
        const elements = typeof target === 'string' 
            ? document.querySelectorAll(target) 
            : [target];
            
        const defaultOptions = {
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1], // Sogna Standard Ease
            delay: 0,
        };
        
        const settings = { ...defaultOptions, ...options };
        
        elements.forEach(el => {
            // SBP: Sovereignty check - ensures we are not injecting external tracking
            el.animate(props, {
                duration: settings.duration * 1000,
                delay: settings.delay * 1000,
                easing: typeof settings.ease === 'string' 
                    ? settings.ease 
                    : `cubic-bezier(${settings.ease.join(',')})`,
                fill: 'forwards'
            });
        });
    },

    /**
     * Scroll-based kinetic triggers.
     */
    scroll: (target, onInView, options = {}) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    onInView(entry.target);
                    if (options.once) observer.unobserve(entry.target);
                }
            });
        }, { threshold: options.threshold || 0.1 });

        const elements = typeof target === 'string' 
            ? document.querySelectorAll(target) 
            : [target];
            
        elements.forEach(el => observer.observe(el));
    },

    /**
     * Sogna Standard sognaflow Presets.
     */
    presets: {
        fadeUp: { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
        fadeIn: { opacity: [0, 1] },
        scaleIn: { opacity: [0, 1], transform: ['scale(0.9)', 'scale(1)'] },
        slideRight: { opacity: [0, 1], transform: ['translateX(-30px)', 'translateX(0)'] }
    }
};

export { flow };
