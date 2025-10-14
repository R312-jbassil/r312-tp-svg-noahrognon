import pb from "../../utils/pb";
import { Collections } from "../../utils/pocketbase-types";

export async function POST({ request, locals }) {
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

    const { id, name, code_svg, chat_history, is_public } = payload ?? {};
    const userId = locals?.user?.id;

    if (!id) {
        return new Response(
            JSON.stringify({ success: false, error: "Missing record id" }),
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

    let record;
    try {
        record = await pb.collection(Collections.Svg).getOne(id);
    } catch (error) {
        console.error("updateSVG: unable to load record", error);
        return new Response(
            JSON.stringify({ success: false, error: "Record not found" }),
            {
                status: 404,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    const recordOwner = record.owner ?? record.users;

    if (recordOwner !== userId) {
        return new Response(
            JSON.stringify({ success: false, error: "Forbidden" }),
            {
                status: 403,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code_svg !== undefined) updateData.code_svg = code_svg;
    if (chat_history !== undefined) updateData.chat_history = chat_history;
    if (is_public !== undefined) updateData.is_public = Boolean(is_public);

    if (Object.keys(updateData).length === 0) {
        return new Response(
            JSON.stringify({ success: false, error: "Nothing to update" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    console.log("Updating SVG:", { id, fields: Object.keys(updateData) });

    try {
        const updated = await pb.collection(Collections.Svg).update(id, updateData);
        return new Response(JSON.stringify({ success: true, id: updated.id }), {
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
