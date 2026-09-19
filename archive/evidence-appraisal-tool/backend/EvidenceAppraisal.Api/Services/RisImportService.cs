using System.Security.Cryptography;
using System.Text;
using EvidenceAppraisal.Api.Models;

namespace EvidenceAppraisal.Api.Services;

public sealed class RisImportService
{
    public List<StudyMetadata> ParseRisFile(string fileContent)
    {
        if (string.IsNullOrWhiteSpace(fileContent)) return new();
        var normalized = fileContent.Replace("\r\n", "\n").Replace('\r', '\n');
        var records = normalized.Split("ER  -", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var studies = new List<StudyMetadata>();

        foreach (var record in records)
        {
            var study = new StudyMetadata();
            string? currentTag = null;
            foreach (var rawLine in record.Split('\n'))
            {
                var line = rawLine.TrimEnd();
                if (line.Length < 2) continue;
                var tag = line[..2];
                var isTagLine = line.Length >= 5 && line[2] == ' ' && line[3] == ' ' && line[4] == '-';
                if (isTagLine)
                {
                    currentTag = tag;
                    AddTagValue(study, tag, line.Length > 6 ? line[6..].Trim() : string.Empty);
                }
                else if (currentTag is not null && !string.IsNullOrWhiteSpace(line))
                    AppendContinuation(study, currentTag, line.Trim());
            }

            study.Title = study.Title.Trim();
            study.Doi = NormalizeDoi(study.Doi);
            study.Authors = study.Authors.Where(a => !string.IsNullOrWhiteSpace(a)).Select(a => a.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (!string.IsNullOrWhiteSpace(study.Title))
            {
                study.ImportFingerprint = CreateFingerprint(study);
                studies.Add(study);
            }
        }
        return studies;
    }

    private static void AddTagValue(StudyMetadata study, string tag, string value)
    {
        switch (tag.ToUpperInvariant())
        {
            case "TY": study.Type = value; break;
            case "AU": study.Authors.Add(value); break;
            case "TI": case "T1": study.Title = AppendValue(study.Title, value); break;
            case "PY": case "Y1": study.Year = value; break;
            case "DO": study.Doi = value; break;
            case "JF": case "JO": study.Journal = AppendValue(study.Journal, value); break;
            case "AB": case "N2": study.Abstract = AppendValue(study.Abstract, value); break;
        }
    }

    private static void AppendContinuation(StudyMetadata study, string tag, string value)
    {
        switch (tag.ToUpperInvariant())
        {
            case "TI": case "T1": study.Title = AppendValue(study.Title, value); break;
            case "JF": case "JO": study.Journal = AppendValue(study.Journal, value); break;
            case "AB": case "N2": study.Abstract = AppendValue(study.Abstract, value); break;
        }
    }

    private static string AppendValue(string? existing, string value) => string.IsNullOrWhiteSpace(existing) ? value : $"{existing} {value}";

    private static string? NormalizeDoi(string? doi)
    {
        if (string.IsNullOrWhiteSpace(doi)) return null;
        var value = doi.Trim();
        if (value.StartsWith("https://doi.org/", StringComparison.OrdinalIgnoreCase)) value = value[16..];
        else if (value.StartsWith("http://doi.org/", StringComparison.OrdinalIgnoreCase)) value = value[15..];
        else if (value.StartsWith("doi:", StringComparison.OrdinalIgnoreCase)) value = value[4..];
        return value.Trim().TrimEnd('.');
    }

    private static string CreateFingerprint(StudyMetadata study)
    {
        var canonical = string.Join("|", study.Title.Trim().ToLowerInvariant(), study.Year?.Trim().ToLowerInvariant() ?? "", NormalizeDoi(study.Doi)?.ToLowerInvariant() ?? "", study.Journal?.Trim().ToLowerInvariant() ?? "", string.Join(";", study.Authors.Select(a => a.Trim().ToLowerInvariant())));
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();
    }
}
