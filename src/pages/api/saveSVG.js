// src/pages/api/saveSVG.js
export const POST = async ({ request }) => {
    try {
        const { name, svg } = await request.json();
        if (!name || !svg) {
            return new Response(JSON.stringify({ ok: false, error: "name et svg requis" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const url = `${import.meta.env.PB_URL}/api/collections/svgs/records`;
        const headers = {
            "Content-Type": "application/json",
        };
        const adminToken = import.meta.env.PB_ADMIN_TOKEN;
        if (adminToken) {
            headers.Authorization = adminToken; // only set when provided
        }

        const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({ name, svg }),
        });

        if (!res.ok) {
            const err = await res.text();
            return new Response(
                JSON.stringify({ ok: false, error: err || "PocketBase error" }),
                {
                    status: res.status || 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        let record;
        try {
            record = await res.json();
        } catch (err) {
            console.error("saveSVG: invalid JSON response", err);
            return new Response(
                JSON.stringify({ ok: false, error: "Reponse PocketBase invalide" }),
                {
                    status: 502,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        return new Response(JSON.stringify({ ok: true, id: record.id }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
