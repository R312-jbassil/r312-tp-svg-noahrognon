import { OpenAI } from "openai";

const OR_TOKEN = import.meta.env.OR_TOKEN;
const NOM_MODEL = import.meta.env.NOM_MODEL;
const OR_URL = import.meta.env.OR_URL;

const jsonHeaders = { "Content-Type": "application/json" };

export const POST = async ({ request }) => {
    let body;
    try {
        body = await request.json();
    } catch (error) {
        console.error("Invalid JSON body", error);
        return new Response(
            JSON.stringify({ error: "Invalid JSON payload." }),
            { status: 400, headers: jsonHeaders },
        );
    }

    const { messages } = body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
        return new Response(
            JSON.stringify({ error: "Missing conversation messages." }),
            { status: 400, headers: jsonHeaders },
        );
    }

    if (!OR_TOKEN || !OR_URL || !NOM_MODEL) {
        console.error("Missing OpenRouter configuration", {
            hasToken: Boolean(OR_TOKEN),
            hasUrl: Boolean(OR_URL),
            hasModel: Boolean(NOM_MODEL),
        });
        return new Response(
            JSON.stringify({ error: "Server misconfigured for OpenRouter." }),
            { status: 500, headers: jsonHeaders },
        );
    }

    const client = new OpenAI({
        baseURL: OR_URL,
        apiKey: OR_TOKEN,
    });

    const systemMessage = {
        role: "system",
        content:
            "You are an SVG code generator. Generate SVG code for the following messages. Make sure to include ids for each part of the generated SVG.",
    };

    try {
        const chatCompletion = await client.chat.completions.create({
            model: NOM_MODEL,
            messages: [systemMessage, ...messages],
        });

        const message = chatCompletion.choices?.[0]?.message ?? {
            role: "assistant",
            content: "",
        };

        const svgMatch = message.content?.match(/<svg[\s\S]*?<\/svg>/i);
        message.content = svgMatch ? svgMatch[0] : "";

        console.log("Generated SVG:", message);

        return new Response(JSON.stringify({ svg: message }), {
            headers: jsonHeaders,
        });
    } catch (error) {
        console.error("OpenRouter call failed", error);
        return new Response(
            JSON.stringify({ error: "Failed to generate SVG." }),
            { status: 502, headers: jsonHeaders },
        );
    }
};
