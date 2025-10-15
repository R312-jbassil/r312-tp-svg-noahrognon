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

    const invokeModel = async (modelId) => {
        const chatCompletion = await client.chat.completions.create({
            model: modelId,
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
    };

    try {
        return await invokeModel(NOM_MODEL);
    } catch (error) {
        console.error("OpenRouter call failed", error);

        const shouldRetry =
            error?.status === 404 ||
            error?.code === 404 ||
            error?.error?.code === 404;

        if (shouldRetry && NOM_MODEL !== "openrouter/auto") {
            console.warn(`Retrying with fallback model openrouter/auto due to 404 on ${NOM_MODEL}`);
            try {
                return await invokeModel("openrouter/auto");
            } catch (fallbackError) {
                console.error("Fallback model invocation failed", fallbackError);
            }
        }

        const message = typeof error?.message === "string" ? error.message : "Failed to generate SVG.";
        return new Response(JSON.stringify({ error: message }), {
            status: 502,
            headers: jsonHeaders,
        });
    }
};
