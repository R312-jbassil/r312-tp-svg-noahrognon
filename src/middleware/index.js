
import pb from '../utils/pb.js';

const publicApiRoutes = ['/apis/login', '/apis/signup'];
const publicPages = new Set(['/login', '/signup', '/']);

export const onRequest = async (context, next) => {
    const cookie = context.cookies.get('pb_auth')?.value;

    if (cookie) {
        pb.authStore.loadFromCookie(cookie);
        if (pb.authStore.isValid) {
            context.locals.user = pb.authStore.record;
        }
    }

    const pathname = context.url.pathname;

    if (pathname.startsWith('/apis/')) {
        if (!context.locals.user && !publicApiRoutes.includes(pathname)) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        return next();
    }

    if (!context.locals.user && !publicPages.has(pathname)) {
        return Response.redirect(new URL('/login', context.url), 303);
    }

    if (context.request.method === 'POST') {
        const form = await context.request.formData().catch(() => null);
        const lang = form?.get('language');

        if (lang === 'en' || lang === 'fr') {
            context.cookies.set('locale', String(lang), {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
            });

            return Response.redirect(new URL(context.url.pathname + context.url.search, context.url), 303);
        }
    }

    const cookieLocale = context.cookies.get('locale')?.value;
    context.locals.lang = cookieLocale === 'fr' || cookieLocale === 'en'
        ? cookieLocale
        : context.preferredLocale ?? 'en';

    return next();
};
