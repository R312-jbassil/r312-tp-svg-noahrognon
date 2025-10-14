import pb from "../../../utils/pb";
import { Collections } from "../../../utils/pocketbase-types";

export async function POST({ request, locals }) {
    let payload;

    try {
        payload = await request.json();
    } catch (error) {
        console.error("likes/toggle: invalid JSON", error);
        return new Response(JSON.stringify({ success: false, error: "Invalid JSON payload" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const userId = locals?.user?.id;
    if (!userId) {
        return new Response(
            JSON.stringify({ success: false, error: "Missing authenticated user" }),
            {
                status: 401,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    const { svgId, like } = payload ?? {};
    if (!svgId || typeof like !== "boolean") {
        return new Response(
            JSON.stringify({ success: false, error: "Missing svgId or like flag" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    let svgRecord;
    try {
        svgRecord = await pb.collection(Collections.Svg).getOne(svgId);
    } catch (error) {
        console.error("likes/toggle: SVG not found", error);
        return new Response(
            JSON.stringify({ success: false, error: "SVG not found" }),
            {
                status: 404,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    const recordOwner = svgRecord.owner ?? svgRecord.users;
    if (!svgRecord.is_public && recordOwner !== userId) {
        return new Response(
            JSON.stringify({ success: false, error: "Forbidden" }),
            {
                status: 403,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    const currentLikes =
        typeof svgRecord.likes_count === "number" && !Number.isNaN(svgRecord.likes_count)
            ? svgRecord.likes_count
            : 0;

    const delta = like ? 1 : -1;
    const nextLikes = Math.max(0, currentLikes + delta);

    try {
        await pb.collection(Collections.Svg).update(svgId, { likes_count: nextLikes });
    } catch (error) {
        console.error("likes/toggle: unable to persist likes_count", error);
        return new Response(
            JSON.stringify({ success: false, error: "Unable to update like" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    return new Response(
        JSON.stringify({ success: true, liked: like, likesCount: nextLikes }),
        {
            headers: { "Content-Type": "application/json" },
        },
    );
}
