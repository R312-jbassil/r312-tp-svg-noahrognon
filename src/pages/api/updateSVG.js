import pb from "../../utils/pb";
import { Collections } from "../../utils/pocketbase-types";

export async function POST({ request }) {
    let payload;

    try {
        payload = await request.json();
    } catch (error) {
        console.error("updateSVG: invalid JSON", error);
        return new Response(JSON.stringify({ success: false, error: "Invalid JSON payload" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { id, name, code_svg, chat_history } = payload ?? {};

    if (!id) {
        return new Response(
            JSON.stringify({ success: false, error: "Missing record id" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code_svg !== undefined) updateData.code_svg = code_svg;
    if (chat_history !== undefined) updateData.chat_history = chat_history;

    console.log("Updating SVG:", { id, updateData });

    try {
        const record = await pb.collection(Collections.Svg).update(id, updateData);
        return new Response(JSON.stringify({ success: true, id: record.id }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error updating SVG:", error);
        return new Response(
            JSON.stringify({ success: false, error: error?.message || "PocketBase error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
