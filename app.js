const $ = id => document.getElementById(id);

const demo = `CaseId,Timestamp,Activity,PerformedBy
C001,2026-08-28 08:00:00,Assessment,NurseA
C001,2026-08-28 08:30:00,Intervention,NurseA
C001,2026-08-28 09:00:00,FollowUp,NurseA
C002,2026-08-28 10:00:00,Assessment,NurseB
C002,2026-08-28 11:00:00,FollowUp,NurseB
C003,2026-08-28 12:00:00,Assessment,NurseC
C003,2026-08-28 12:30:00,Intervention,NurseC`;

function parseCsv(text) {

    const lines = text.trim().split(/\r?\n/);

    if (lines.length <= 1) {
        return {};
    }

    const cases = {};

    for (const line of lines.slice(1)) {

        const parts = line.split(",");

        if (parts.length < 4) {
            continue;
        }

        const caseId = parts[0].trim();
        const timestamp = parts[1].trim();
        const activity = parts[2].trim();
        const performedBy = parts[3].trim();

        if (!cases[caseId]) {
            cases[caseId] = [];
        }

        cases[caseId].push({
            timestamp,
            activity,
            performedBy
        });
    }

    return cases;
}

function analyse() {

    const expected = $("expected")
        .value
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    const raw = $("csv").value.trim();

    if (!raw) {

        $("out").innerHTML = `
            <h2>3. Result</h2>
            <p>No observation data supplied.</p>
        `;

        return;
    }

    const cases = parseCsv(raw);

    const results = Object.entries(cases).map(
        ([caseId, events]) => {

            events.sort(
                (a, b) =>
                    a.timestamp.localeCompare(b.timestamp)
            );

            const actual = events.map(
                event => event.activity
            );

            const missing = expected.filter(
                activity => !actual.includes(activity)
            );

            const unexpected = actual.filter(
                activity => !expected.includes(activity)
            );

            const matched =
                expected.length - missing.length;

            const fidelity =
                expected.length === 0
                    ? 0
                    : matched / expected.length * 100;

            return {
                caseId,
                fidelity,
                missing,
                unexpected
            };
        }
    );

    const mean =
        results.length === 0
            ? 0
            : results.reduce(
                (sum, result) =>
                    sum + result.fidelity,
                0
            ) / results.length;

    const html = results.map(result => {

        const type =
            result.fidelity === 100
                ? "ok"
                : "gap";

        return `
            <div class="${type}">
                <strong>
                    ${result.caseId}
                    —
                    ${result.fidelity.toFixed(1)}%
                </strong>

                <br>

                Missing:
                ${result.missing.join(", ") || "none"}

                <br>

                Unexpected:
                ${result.unexpected.join(", ") || "none"}
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
                <strong>${mean.toFixed(1)}%</strong>
                <span>mean fidelity</span>
            </div>

        </div>

        ${html}

        <p class="note">
            Structural mismatch signal only.
        </p>
    `;
}

$("demo").addEventListener(
    "click",
    () => {
        $("csv").value = demo;
        analyse();
    }
);

$("run").addEventListener(
    "click",
    analyse
);
