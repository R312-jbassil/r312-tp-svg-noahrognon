import PocketBase from "pocketbase";
import pb from "../../../utils/pb";
import { Collections } from "../../../utils/pocketbase-types";

const jsonHeaders = { "Content-Type": "application/json" };
const pocketbaseUrl = import.meta.env.PB_URL ?? "http://127.0.0.1:8088";

export const POST = async ({ request, locals, cookies }) => {
    if (!locals?.user) {
        return new Response(
            JSON.stringify({ success: false, error: "Unauthorized" }),
            { status: 401, headers: jsonHeaders },
        );
    }

    let payload;
    try {
        payload = await request.json();
    } catch (error) {
        console.error("Password update: invalid JSON", error);
        return new Response(
            JSON.stringify({ success: false, error: "Invalid JSON payload." }),
            { status: 400, headers: jsonHeaders },
        );
    }

    const { currentPassword, newPassword, confirmPassword } = payload ?? {};

    if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword ||
        newPassword.length < 8 ||
        confirmPassword.length < 8
    ) {
        return new Response(
            JSON.stringify({ success: false, error: "Invalid payload" }),
            { status: 400, headers: jsonHeaders },
        );
    }

    if (newPassword !== confirmPassword) {
        return new Response(
            JSON.stringify({ success: false, error: "Passwords do not match" }),
            { status: 400, headers: jsonHeaders },
        );
    }

    const email = locals.user?.email || locals.user?.username;
    if (!email) {
        return new Response(
            JSON.stringify({ success: false, error: "User email missing" }),
            { status: 400, headers: jsonHeaders },
        );
    }

    try {
        const verifier = new PocketBase(pocketbaseUrl);
        await verifier.collection(Collections.Users).authWithPassword(email, currentPassword);
    } catch (error) {
        console.warn("Password update: invalid current password", error);
        return new Response(
            JSON.stringify({ success: false, error: "Invalid current password" }),
            { status: 401, headers: jsonHeaders },
        );
    }

    try {
        await pb.collection(Collections.Users).update(locals.user.id, {
            password: newPassword,
            passwordConfirm: confirmPassword,
        });

        const authData = await pb.collection(Collections.Users).authWithPassword(email, newPassword);

        cookies.set("pb_auth", pb.authStore.exportToCookie(), {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });

        return new Response(
            JSON.stringify({ success: true, user: authData.record }),
            { headers: jsonHeaders },
        );
    } catch (error) {
        console.error("Password update failed", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error?.message || "Password update failed",
            }),
            { status: 500, headers: jsonHeaders },
        );
    }
};
