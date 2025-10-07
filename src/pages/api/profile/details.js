import pb from "../../../utils/pb";
import { Collections } from "../../../utils/pocketbase-types";

const jsonHeaders = { "Content-Type": "application/json" };
const MAX_AVATAR_SIZE = 3 * 1024 * 1024; // 3 MB

export const POST = async ({ request, locals, cookies }) => {
    if (!locals?.user) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
            status: 401,
            headers: jsonHeaders,
        });
    }

    let formData;
    try {
        formData = await request.formData();
    } catch (error) {
        console.error("Profile update failed: invalid form data", error);
        return new Response(JSON.stringify({ success: false, error: "Invalid form data" }), {
            status: 400,
            headers: jsonHeaders,
        });
    }

    const name = (formData.get("name") || "").toString().trim();
    const avatar = formData.get("avatar");

    if (!name) {
        return new Response(JSON.stringify({ success: false, error: "Name required" }), {
            status: 400,
            headers: jsonHeaders,
        });
    }

    if (avatar instanceof File) {
        if (avatar.size > MAX_AVATAR_SIZE) {
            return new Response(
                JSON.stringify({ success: false, error: "Image too large (max 3 MB)" }),
                { status: 400, headers: jsonHeaders },
            );
        }
        if (avatar.size > 0 && !avatar.type.startsWith("image/")) {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid image format" }),
                { status: 400, headers: jsonHeaders },
            );
        }
    }

    const updatePayload = new FormData();
    updatePayload.append("name", name);
    if (avatar instanceof File && avatar.size > 0) {
        updatePayload.append("avatar", avatar, avatar.name);
    }

    try {
        await pb.collection(Collections.Users).update(locals.user.id, updatePayload);
        const authData = await pb.collection(Collections.Users).authRefresh();

        cookies.set("pb_auth", pb.authStore.exportToCookie(), {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });

        return new Response(JSON.stringify({ success: true, user: authData.record }), {
            headers: jsonHeaders,
        });
    } catch (error) {
        console.error("Profile update failed:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error?.message || "Failed to update profile",
            }),
            { status: 500, headers: jsonHeaders },
        );
    }
};
