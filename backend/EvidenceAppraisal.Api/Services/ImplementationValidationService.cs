using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

public sealed class ImplementationValidationService
{
    private static readonly IReadOnlyCollection<CfirConstructDefinition> CfirConstructs =
    [
        new() { Domain = CfirDomain.Innovation, Name = "Innovation Source" },
        new() { Domain = CfirDomain.Innovation, Name = "Innovation Evidence-Base" },
        new() { Domain = CfirDomain.Innovation, Name = "Innovation Relative Advantage" },
        new() { Domain = CfirDomain.Innovation, Name = "Innovation Adaptability" },
        new() { Domain = CfirDomain.Innovation, Name = "Innovation Trialability" },
        new() { Domain = CfirDomain.Innovation, Name = "Innovation Complexity" },
        new() { Domain = CfirDomain.Innovation, Name = "Innovation Design" },
        new() { Domain = CfirDomain.Innovation, Name = "Innovation Cost" },
        new() { Domain = CfirDomain.OuterSetting, Name = "Critical Incidents" },
        new() { Domain = CfirDomain.OuterSetting, Name = "Local Attitudes" },
        new() { Domain = CfirDomain.OuterSetting, Name = "Local Conditions" },
        new() { Domain = CfirDomain.OuterSetting, Name = "Partnerships & Connections" },
        new() { Domain = CfirDomain.OuterSetting, Name = "Policies & Laws" },
        new() { Domain = CfirDomain.OuterSetting, Name = "Financing" },
        new() { Domain = CfirDomain.OuterSetting, Name = "External Pressure" },
        new() { Domain = CfirDomain.InnerSetting, Name = "Structural Characteristics" },
        new() { Domain = CfirDomain.InnerSetting, Name = "Relational Connections" },
        new() { Domain = CfirDomain.InnerSetting, Name = "Communications" },
        new() { Domain = CfirDomain.InnerSetting, Name = "Culture" },
        new() { Domain = CfirDomain.InnerSetting, Name = "Tension for Change" },
        new() { Domain = CfirDomain.InnerSetting, Name = "Compatibility" },
        new() { Domain = CfirDomain.InnerSetting, Name = "Relative Priority" },
        new() { Domain = CfirDomain.InnerSetting, Name = "Incentive Systems" },
        new() { Domain = CfirDomain.InnerSetting, Name = "Mission Alignment" },
        new() { Domain = CfirDomain.InnerSetting, Name = "Available Resources" },
        new() { Domain = CfirDomain.InnerSetting, Name = "Access to Knowledge & Information" },
        new() { Domain = CfirDomain.Individuals, Name = "High-level Leaders" },
        new() { Domain = CfirDomain.Individuals, Name = "Mid-level Leaders" },
        new() { Domain = CfirDomain.Individuals, Name = "Opinion Leaders" },
        new() { Domain = CfirDomain.Individuals, Name = "Implementation Facilitators" },
        new() { Domain = CfirDomain.Individuals, Name = "Implementation Leads" },
        new() { Domain = CfirDomain.Individuals, Name = "Implementation Team Members" },
        new() { Domain = CfirDomain.Individuals, Name = "Other Implementation Support" },
        new() { Domain = CfirDomain.Individuals, Name = "Innovation Deliverers" },
        new() { Domain = CfirDomain.Individuals, Name = "Innovation Recipients" },
        new() { Domain = CfirDomain.Individuals, Name = "Need" },
        new() { Domain = CfirDomain.Individuals, Name = "Capability" },
        new() { Domain = CfirDomain.Individuals, Name = "Opportunity" },
        new() { Domain = CfirDomain.Individuals, Name = "Motivation" },
        new() { Domain = CfirDomain.ImplementationProcess, Name = "Teaming" },
        new() { Domain = CfirDomain.ImplementationProcess, Name = "Assessing Needs" },
        new() { Domain = CfirDomain.ImplementationProcess, Name = "Assessing Context" },
        new() { Domain = CfirDomain.ImplementationProcess, Name = "Planning" },
        new() { Domain = CfirDomain.ImplementationProcess, Name = "Tailoring Strategies" },
        new() { Domain = CfirDomain.ImplementationProcess, Name = "Engaging" },
        new() { Domain = CfirDomain.ImplementationProcess, Name = "Doing" },
        new() { Domain = CfirDomain.ImplementationProcess, Name = "Reflecting & Evaluating" },
        new() { Domain = CfirDomain.ImplementationProcess, Name = "Adapting" }
    ];

    private static readonly IReadOnlyCollection<(int Number, string Name)> KtaPhases =
    [
        (1, "Identify problem"),
        (2, "Adapt knowledge to local context"),
        (3, "Assess barriers and facilitators"),
        (4, "Select, tailor and implement interventions"),
        (5, "Monitor knowledge use"),
        (6, "Evaluate outcomes"),
        (7, "Sustain knowledge use")
    ];

    public IReadOnlyCollection<CfirConstructDefinition> GetCfirConstructs() => CfirConstructs;

    public IReadOnlyCollection<KtaPhase> GetKtaPhases() => KtaPhases
        .Select(p => new KtaPhase { Number = p.Number, Name = p.Name, Status = KtaPhaseStatus.NotStarted, Documentation = string.Empty })
        .ToArray();

    public CfirAssessmentResult Validate(CfirAssessment assessment)
    {
        var errors = new List<string>();
        var warnings = new List<string>();
        Required(assessment.InnovationName, "Innovation name", errors);
        Required(assessment.InnerSetting, "Inner Setting", errors);
        Required(assessment.OuterSetting, "Outer Setting", errors);
        Required(assessment.ReviewerCode, "Reviewer code", errors);
        Required(assessment.CfirVersion, "CFIR version", errors);

        if (!string.Equals(assessment.CfirVersion, "CFIR 2.0", StringComparison.OrdinalIgnoreCase))
            errors.Add("This application is configured for the updated CFIR 2.0 framework; select CFIR 2.0 explicitly.");

        ValidateReviewerWorkflow(assessment.SecondReviewerCode, assessment.ConsensusReviewerCode, assessment.ConsensusStatus, assessment.ConsensusRationale, errors, warnings);

        var items = assessment.Items ?? [];
        var known = CfirConstructs.ToDictionary(x => $"{x.Domain}|{x.Name}", StringComparer.OrdinalIgnoreCase);
        var duplicateKeys = items.GroupBy(x => $"{x.Domain}|{x.Construct}", StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1).Select(g => g.Key);
        foreach (var key in duplicateKeys)
            errors.Add($"Duplicate CFIR construct assessment: {key}.");

        foreach (var item in items)
        {
            if (!known.ContainsKey($"{item.Domain}|{item.Construct}"))
                errors.Add($"Unknown CFIR construct for the selected CFIR 2.0 list: {item.Domain} / {item.Construct}.");
            Required(item.Rationale, $"{item.Construct}: rationale", errors);
            Required(item.EvidenceLocation, $"{item.Construct}: evidence location", errors);
        }

        if (items.Count == 0)
            errors.Add("At least one CFIR construct must be assessed.");

        warnings.Add("CFIR 2.0 contains 48 constructs and 19 subconstructs. The catalogue exposed here lists the 48 constructs; project-specific operationalization and relevant subconstructs must be documented separately when applicable.");
        warnings.Add("CFIR construct selection and ratings are researcher decisions. Use project-specific coding and rating guidance and a consensus process where appropriate.");
        warnings.Add("CFIR is a determinant framework, not a stand-alone process model and not a validated score-producing questionnaire.");

        return new CfirAssessmentResult
        {
            IsValid = errors.Count == 0,
            Errors = errors,
            Warnings = warnings,
            MethodologicalNotice = "CFIR 2.0 structures assessment of implementation determinants. The application records researcher judgements; it does not determine barrier/facilitator status automatically."
        };
    }

    public KtaAssessmentResult Validate(KtaAssessment assessment)
    {
        var errors = new List<string>();
        var warnings = new List<string>();
        Required(assessment.ProjectName, "Project name", errors);
        Required(assessment.ReviewerCode, "Reviewer code", errors);
        Required(assessment.KtaFrameworkVersion, "KTA framework version", errors);

        if (!string.Equals(assessment.KtaFrameworkVersion, "Graham et al., 2006", StringComparison.OrdinalIgnoreCase))
            errors.Add("The KTA framework version must identify Graham et al. (2006) for this implementation module.");

        var phases = assessment.Phases ?? [];
        var expected = KtaPhases.ToDictionary(x => x.Number);
        foreach (var phase in phases)
        {
            if (!expected.TryGetValue(phase.Number, out var definition))
            {
                errors.Add($"Unknown KTA phase number: {phase.Number}.");
                continue;
            }
            if (!string.Equals(phase.Name, definition.Name, StringComparison.Ordinal))
                errors.Add($"KTA phase {phase.Number} has an unexpected name.");
            if (phase.Status == KtaPhaseStatus.Completed)
                Required(phase.Documentation, $"KTA phase {phase.Number}: documentation", errors);
        }

        var duplicateNumbers = phases.GroupBy(x => x.Number).Where(g => g.Count() > 1).Select(g => g.Key);
        foreach (var number in duplicateNumbers)
            errors.Add($"Duplicate KTA phase: {number}.");
        if (phases.Count != 7)
            errors.Add("All seven KTA action-cycle phases must be represented before an assessment can be completed.");

        ValidateActions(assessment.Actions ?? [], errors, warnings);
        warnings.Add("The KTA action cycle is iterative and bidirectional; phase status is documentation only and is not a validated implementation-effectiveness score.");

        return new KtaAssessmentResult
        {
            IsValid = errors.Count == 0,
            Errors = errors,
            Warnings = warnings,
            MethodologicalNotice = "The KTA framework describes knowledge creation and a seven-step action cycle. This application does not convert phase status into a scientific implementation-effectiveness score."
        };
    }

    public ImplementationAssessmentResult ValidateImplementation(CfirAssessment cfir, KtaAssessment kta)
    {
        var cfirResult = Validate(cfir);
        var ktaResult = Validate(kta);
        var errors = ktaResult.Errors.ToList();
        var warnings = ktaResult.Warnings.ToList();
        var knownCfir = (cfir.Items ?? []).Select(i => $"{i.Domain}|{i.Construct}").ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var action in kta.Actions ?? [])
        {
            foreach (var key in action.LinkedCfirConstructKeys ?? [])
            {
                if (!knownCfir.Contains(key))
                    errors.Add($"Action '{action.Title}' links to CFIR construct '{key}', but that construct is not included in the current CFIR assessment.");
            }
        }

        if ((cfir.Items ?? []).Any(i => i.Influence is CfirInfluence.StrongBarrier or CfirInfluence.Barrier) &&
            !(kta.Actions ?? []).Any(a => (a.LinkedCfirConstructKeys ?? []).Any()))
            warnings.Add("The current CFIR assessment contains barrier judgements but no KTA implementation action is linked to a CFIR construct. This is a review flag, not proof that an action is required.");

        var finalKta = ktaResult with
        {
            IsValid = errors.Count == 0,
            Errors = errors,
            Warnings = warnings
        };

        return new ImplementationAssessmentResult
        {
            IsValid = cfirResult.IsValid && finalKta.IsValid,
            Cfir = cfirResult,
            Kta = finalKta
        };
    }

    private static void ValidateActions(IReadOnlyCollection<ImplementationAction> actions, ICollection<string> errors, ICollection<string> warnings)
    {
        var duplicateIds = actions.GroupBy(a => a.Id).Where(g => g.Count() > 1).Select(g => g.Key);
        foreach (var id in duplicateIds)
            errors.Add($"Duplicate implementation action ID: {id}.");

        foreach (var action in actions)
        {
            Required(action.Title, "Implementation action title", errors);
            Required(action.Description, $"Action '{action.Title}': description", errors);
            Required(action.OwnerCode, $"Action '{action.Title}': owner code", errors);
            if (!KtaPhases.Any(p => p.Number == action.KtaPhaseNumber))
                errors.Add($"Action '{action.Title}' references unknown KTA phase {action.KtaPhaseNumber}.");
            if (action.DueDateUtc is not null && action.DueDateUtc.Value.Year < 2000)
                errors.Add($"Action '{action.Title}' has an invalid due date.");
            if (action.Status == ImplementationActionStatus.Completed && action.DueDateUtc is null)
                warnings.Add($"Action '{action.Title}' is marked completed without a due date; verify the project record if a due date was used.");
            if ((action.LinkedCfirConstructKeys ?? []).Count == 0)
                warnings.Add($"Action '{action.Title}' has no CFIR construct link. If it addresses a determinant, record the link explicitly.");
        }
    }

    private static void ValidateReviewerWorkflow(string? secondReviewer, string? consensusReviewer, string? consensusStatus, string? consensusRationale, ICollection<string> errors, ICollection<string> warnings)
    {
        if (!string.IsNullOrWhiteSpace(consensusStatus) && string.IsNullOrWhiteSpace(secondReviewer))
            errors.Add("A consensus status cannot be recorded without a second reviewer code.");

        if (!string.IsNullOrWhiteSpace(consensusStatus) && !string.Equals(consensusStatus, "Agreement", StringComparison.OrdinalIgnoreCase) && !string.Equals(consensusStatus, "Disagreement", StringComparison.OrdinalIgnoreCase))
            errors.Add("Consensus status must be Agreement or Disagreement.");

        if (string.Equals(consensusStatus, "Disagreement", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(consensusRationale))
            errors.Add("Consensus rationale is required when disagreement is recorded.");

        if (!string.IsNullOrWhiteSpace(secondReviewer) && string.IsNullOrWhiteSpace(consensusStatus))
            warnings.Add("A second reviewer is recorded, but no consensus status has been documented yet.");

        if (!string.IsNullOrWhiteSpace(consensusStatus) && string.IsNullOrWhiteSpace(consensusReviewer))
            errors.Add("Consensus reviewer code is required when consensus status is recorded.");
    }

    private static void Required(string? value, string label, ICollection<string> errors)
    {
        if (string.IsNullOrWhiteSpace(value)) errors.Add($"{label} is required.");
    }
}
