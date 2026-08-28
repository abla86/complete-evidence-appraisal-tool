const $ = id => document.getElementById(id);

const demo = `CaseId,Timestamp,Activity,PerformedBy
C001,2026-08-28 08:00:00,Assessment,NurseA
C001,2026-08-28 08:30:00,Intervention,NurseA
C001,2026-08-28 09:00:00,FollowUp,NurseA
C002,2026-08-28 10:00:00,Assessment,NurseB
C002,2026-08-28 11:00:00,FollowUp,NurseB
C003,2026-08-28 12:00:00,Assessment,NurseC
C003,2026-08-28 12:30:00,Intervention,NurseC
C004,2026-08-28 13:00:00,Intervention,NurseD
C004,2026-08-28 13:30:00,Assessment,NurseD
C004,2026-08-28 14:00:00,FollowUp,NurseD
C005,2026-08-28 15:00:00,Assessment,NurseE
C005,2026-08-28 15:30:00,Intervention,NurseE
C005,2026-08-28 16:00:00,Intervention,NurseE
C005,2026-08-28 16:30:00,FollowUp,NurseE
C006,2026-08-28 17:00:00,Assessment,NurseF
C006,2026-08-28 17:30:00,Documentation,NurseF`;

function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
            else quoted = !quoted;
        } else if (char === "," && !quoted) {
            row.push(cell.trim()); cell = "";
        } else if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && text[i + 1] === "\n") i++;
            row.push(cell.trim()); cell = "";
            if (row.some(Boolean)) rows.push(row);
            row = [];
        } else {
            cell += char;
        }
    }

    if (cell || row.length) {
        row.push(cell.trim());
        if (row.some(Boolean)) rows.push(row);
    }

    if (rows.length < 2) throw new Error("CSV must contain a header and at least one data row.");

    const header = rows[0].map(x => x.replace(/^\uFEFF/, "").trim().toLowerCase());
    const required = ["caseid", "timestamp", "activity", "performedby"];
    const indexes = required.map(name => header.indexOf(name));

    if (indexes.some(i => i < 0)) {
        throw new Error("CSV header must contain: CaseId, Timestamp, Activity, PerformedBy.");
    }

    const cases = {};
    rows.slice(1).forEach((r, n) => {
        const [caseIndex, timeIndex, activityIndex, personIndex] = indexes;
        const caseId = (r[caseIndex] || "").trim();
        const timestamp = (r[timeIndex] || "").trim();
        const activity = (r[activityIndex] || "").trim();
        const performedBy = (r[personIndex] || "").trim();

        if (!caseId && !timestamp && !activity && !performedBy) return;
        if (!caseId || !timestamp || !activity) {
            throw new Error(`CSV row ${n + 2} is missing CaseId, Timestamp or Activity.`);
        }

        if (Number.isNaN(Date.parse(timestamp))) {
            throw new Error(`CSV row ${n + 2} has an invalid timestamp: ${timestamp}`);
        }

        if (!cases[caseId]) cases[caseId] = [];
        cases[caseId].push({ timestamp, activity, performedBy });
    });

    return cases;
}

function compareSequence(expected, actual) {
    const expectedIndex = new Map(expected.map((activity, index) => [activity, index]));
    const missing = expected.filter(activity => !actual.includes(activity));
    const unexpected = [...new Set(actual.filter(activity => !expectedIndex.has(activity)))];

    const orderViolations = [];
    const observedExpected = actual.filter(activity => expectedIndex.has(activity));

    for (let i = 1; i < observedExpected.length; i++) {
        const previous = expectedIndex.get(observedExpected[i - 1]);
        const current = expectedIndex.get(observedExpected[i]);
        if (current < previous) {
            orderViolations.push(`${observedExpected[i - 1]} → ${observedExpected[i]}`);
        }
    }

    const duplicateExpected = [...new Set(
        expected.filter(activity => actual.filter(x => x === activity).length > 1)
    )];

    const matched = expected.filter(activity => actual.includes(activity)).length;
    const presenceRate = expected.length ? matched / expected.length * 100 : 0;
    const sequenceOk = orderViolations.length === 0;
    const structurallyPass =
        missing.length === 0 &&
        unexpected.length === 0 &&
        orderViolations.length === 0 &&
        duplicateExpected.length === 0;

    return { missing, unexpected, orderViolations, duplicateExpected, presenceRate, structurallyPass };
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showError(message) {
    $("inputError").textContent = message;
}

function analyse() {
    showError("");

    try {
        const expected = $("expected").value.split(",").map(x => x.trim()).filter(Boolean);
        if (!expected.length) throw new Error("Define at least one expected activity.");
        if (new Set(expected).size !== expected.length) throw new Error("Expected activities must be unique.");

        const raw = $("csv").value.trim();
        if (!raw) throw new Error("No observation data supplied.");

        const cases = parseCsv(raw);
        const results = Object.entries(cases).map(([caseId, events]) => {
            events.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
            const comparison = compareSequence(expected, events.map(e => e.activity));
            return { caseId, actual: events.map(e => e.activity), ...comparison };
        });

        if (!results.length) throw new Error("No valid cases found.");

        const compliantCases = results.filter(r => r.structurallyPass).length;
        const meanPresence = results.reduce((sum, r) => sum + r.presenceRate, 0) / results.length;

        const caseHtml = results.map(r => {
            const type = r.structurallyPass ? "ok" : "gap";
            return `
                <div class="${type}">
                    <strong>${escapeHtml(r.caseId)}</strong>
                    <span class="score">${r.presenceRate.toFixed(1)}% presence</span>
                    <div><b>Observed:</b> ${escapeHtml(r.actual.join(" → ") || "none")}</div>
                    <div><b>Missing:</b> ${escapeHtml(r.missing.join(", ") || "none")}</div>
                    <div><b>Unexpected:</b> ${escapeHtml(r.unexpected.join(", ") || "none")}</div>
                    <div><b>Order:</b> ${r.sequenceOk ? "OK" : escapeHtml(r.orderViolations.join("; "))}</div>
                    <div><b>Duplicates:</b> ${escapeHtml(r.duplicateExpected.join(", ") || "none")}</div>
                </div>`;
        }).join("");

        $("out").innerHTML = `
            <h2>3. Result</h2>
            <div class="metrics">
                <div><strong>${results.length}</strong><span>cases</span></div>
                <div><strong>${compliantCases}/${results.length}</strong><span>structurally compliant</span></div>
                <div><strong>${meanPresence.toFixed(1)}%</strong><span>mean activity presence</span></div>
            </div>
            ${caseHtml}
            <p class="note">A structurally compliant case has every expected activity exactly once, no unexpected activity, and the expected order. This is a record-level signal, not proof of clinical quality or causality.</p>`;
    } catch (error) {
        $("out").innerHTML = "<h2>3. Result</h2><p>Analysis could not be completed.</p>";
        showError(error.message);
    }
}

$("demo").addEventListener("click", () => {
    $("csv").value = demo;
    analyse();
});

$("run").addEventListener("click", analyse);

$("clear").addEventListener("click", () => {
    $("csv").value = "";
    $("out").innerHTML = "<h2>3. Result</h2><p>Load the synthetic example or provide CSV data.</p>";
    showError("");
});

$("file").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
        $("csv").value = await file.text();
        analyse();
    } catch (error) {
        showError(error.message);
    }
});