import pb from "../../utils/pb";
import { Collections } from "../../utils/pocketbase-types";

export async function POST({ request, locals }) {
    let payload;

    try {
        payload = await request.json();
    } catch (error) {
        console.error("saveSVG: invalid JSON", error);
        return new Response(JSON.stringify({ success: false, error: "Invalid JSON payload" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { name, code_svg, chat_history, user } = payload ?? {};
    const sessionUserId = locals?.user?.id;
    const userId = sessionUserId ?? user;

    if (!name || !code_svg) {
        return new Response(
            JSON.stringify({ success: false, error: "Missing name or code_svg" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    if (!userId) {
        return new Response(
            JSON.stringify({ success: false, error: "Missing authenticated user" }),
            {
                status: 401,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    if (sessionUserId && user && user !== sessionUserId) {
        return new Response(
            JSON.stringify({ success: false, error: "User mismatch" }),
            {
                status: 403,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    const data = {
        name,
        code_svg,
        chat_history: chat_history ?? "[]",
        users: userId,
    };

    console.log("Received data to save:", data);

    try {
        const record = await pb.collection(Collections.Svg).create(data);
        console.log("SVG saved with ID:", record.id);

        return new Response(JSON.stringify({ success: true, id: record.id }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error saving SVG:", error);
        return new Response(
            JSON.stringify({ success: false, error: error?.message || "PocketBase error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
