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
C004,2026-08-28 14:00:00,FollowUp,NurseD`;

function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length <= 1) return {};

    const cases = {};

    for (const line of lines.slice(1)) {
        const parts = line.split(",");
        if (parts.length < 4) continue;

        const caseId = parts[0].trim();
        const timestamp = parts[1].trim();
        const activity = parts[2].trim();
        const performedBy = parts.slice(3).join(",").trim();

        if (!caseId || !timestamp || !activity) continue;

        if (!cases[caseId]) cases[caseId] = [];

        cases[caseId].push({ timestamp, activity, performedBy });
    }

    return cases;
}

function compareSequence(expected, actual) {
    const missing = [];
    const unexpected = [];
    const orderViolations = [];

    const expectedIndex = new Map(
        expected.map((activity, index) => [activity, index])
    );

    for (const activity of expected) {
        if (!actual.includes(activity)) {
            missing.push(activity);
        }
    }

    for (const activity of actual) {
        if (!expectedIndex.has(activity)) {
            unexpected.push(activity);
        }
    }

    const expectedActivitiesObserved = actual.filter(
        activity => expectedIndex.has(activity)
    );

    for (let i = 1; i < expectedActivitiesObserved.length; i++) {
        const previous = expectedIndex.get(expectedActivitiesObserved[i - 1]);
        const current = expectedIndex.get(expectedActivitiesObserved[i]);

        if (current < previous) {
            orderViolations.push(
                expectedActivitiesObserved[i - 1] +
                " → " +
                expectedActivitiesObserved[i]
            );
        }
    }

    const matched = expected.filter(activity => actual.includes(activity)).length;
    const presenceRate = expected.length
        ? matched / expected.length * 100
        : 0;

    const sequenceOk = orderViolations.length === 0;

    return {
        missing,
        unexpected,
        orderViolations,
        presenceRate,
        sequenceOk
    };
}

function analyse() {
    const expected = $("expected")
        .value
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    const raw = $("csv").value.trim();

    if (!expected.length) {
        $("out").innerHTML = "<h2>3. Result</h2><p>Define at least one expected activity.</p>";
        return;
    }

    if (!raw) {
        $("out").innerHTML = "<h2>3. Result</h2><p>No observation data supplied.</p>";
        return;
    }

    const cases = parseCsv(raw);

    const results = Object.entries(cases).map(([caseId, events]) => {
        events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

        const actual = events.map(event => event.activity);
        const comparison = compareSequence(expected, actual);

        const structuralPass =
            comparison.missing.length === 0 &&
            comparison.unexpected.length === 0 &&
            comparison.sequenceOk;

        return {
            caseId,
            actual,
            ...comparison,
            structuralPass
        };
    });

    const meanPresence = results.length
        ? results.reduce((sum, result) => sum + result.presenceRate, 0) / results.length
        : 0;

    const compliantCases = results.filter(
        result => result.structuralPass
    ).length;

    const caseHtml = results.map(result => {
        const type = result.structuralPass ? "ok" : "gap";

        return `
            <div class="${type}">
                <strong>${escapeHtml(result.caseId)}</strong>
                <span class="score">${result.presenceRate.toFixed(1)}% presence</span>

                <div>Observed:
                    ${escapeHtml(result.actual.join(" → ") || "none")}
                </div>

                <div>Missing:
                    ${escapeHtml(result.missing.join(", ") || "none")}
                </div>

                <div>Unexpected:
                    ${escapeHtml(result.unexpected.join(", ") || "none")}
                </div>

                <div>Order:
                    ${result.sequenceOk
                        ? "OK"
                        : escapeHtml(result.orderViolations.join("; "))}
                </div>
            </div>
        `;
    }).join("");

    $("out").innerHTML = `
        <h2>3. Result</h2>

        <div class="metrics">
            <div>
                <strong>${results.length}</strong>
                <span>cases</span>
            </div>

            <div>
                <strong>${compliantCases}/${results.length}</strong>
                <span>structurally compliant</span>
            </div>

            <div>
                <strong>${meanPresence.toFixed(1)}%</strong>
                <span>mean activity presence</span>
            </div>
        </div>

        ${caseHtml}

        <p class="note">
            "Structurally compliant" means that all expected activities
            were observed, no unexpected activities were detected, and
            the observed expected activities followed the defined order.
        </p>
    `;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

$("demo").addEventListener("click", () => {
    $("csv").value = demo;
    analyse();
});

$("run").addEventListener("click", analyse);