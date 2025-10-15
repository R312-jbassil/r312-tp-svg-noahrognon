import pb from '../../utils/pb.js';
import { Collections } from '../../utils/pocketbase-types.js';

const jsonHeaders = { 'Content-Type': 'application/json' };
const MAX_AVATAR_SIZE = 3 * 1024 * 1024; // 3 MB

export const POST = async ({ request }) => {
    let formData;

    try {
        formData = await request.formData();
    } catch (error) {
        console.error('Signup failed: invalid form data', error);
        return new Response(JSON.stringify({ success: false, error: 'Invalid form data' }), {
            status: 400,
            headers: jsonHeaders,
        });
    }

    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    const passwordConfirm = String(formData.get('passwordConfirm') || '');
    const name = String(formData.get('name') || '').trim();
    const avatar = formData.get('avatar');
    const usernameSource = name || (email.includes('@') ? email.split('@')[0] : email);
    const normalizedUsername = usernameSource
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '');
    const randomSuffix = Math.random().toString(36).slice(2, 6);
    const username = normalizedUsername
        ? `${normalizedUsername}_${randomSuffix}`
        : `user_${randomSuffix}`;

    if (!email || !password || !passwordConfirm) {
        return new Response(
            JSON.stringify({ success: false, error: 'Missing email or password' }),
            { status: 400, headers: jsonHeaders },
        );
    }

    if (password !== passwordConfirm) {
        return new Response(
            JSON.stringify({ success: false, error: 'Passwords do not match' }),
            { status: 400, headers: jsonHeaders },
        );
    }

    if (avatar instanceof File) {
        if (avatar.size > MAX_AVATAR_SIZE) {
            return new Response(
                JSON.stringify({ success: false, error: 'Image too large (max 3 MB)' }),
                { status: 400, headers: jsonHeaders },
            );
        }
        if (avatar.size > 0 && !avatar.type.startsWith('image/')) {
            return new Response(
                JSON.stringify({ success: false, error: 'Invalid image format' }),
                { status: 400, headers: jsonHeaders },
            );
        }
    }

    const signupPayload = new FormData();
    signupPayload.append('email', email);
    signupPayload.append('password', password);
    signupPayload.append('passwordConfirm', passwordConfirm);
    signupPayload.append('username', username);
    if (name) {
        signupPayload.append('name', name);
    }
    if (avatar instanceof File && avatar.size > 0) {
        signupPayload.append('avatar', avatar, avatar.name);
    }

    try {
        const record = await pb.collection(Collections.Users).create(signupPayload);
        pb.authStore.clear();

        return new Response(
            JSON.stringify({ success: true, user: record }),
            { status: 201, headers: jsonHeaders },
        );
    } catch (error) {
        console.error('Signup failed:', error);
        return new Response(
            JSON.stringify({ success: false, error: error?.message || 'Registration failed' }),
            { status: 400, headers: jsonHeaders },
        );
    }
};
