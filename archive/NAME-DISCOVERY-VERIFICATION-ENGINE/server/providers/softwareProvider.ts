import { compareNames } from '../engine/similarity.js';
import { SoftwareMatch } from '../../src/types/index.js';
import { ProviderExecutionResult, SearchProvider } from './types.js';

interface ItunesApp {
  trackName: string;
  artistName: string;
  version: string;
  trackViewUrl: string;
  primaryGenreName: string;
  description?: string;
}

interface NpmPackage {
  name: string;
  version: string;
  description?: string;
  publisher?: { username: string };
  links?: { npm: string; homepage?: string };
}

export class SoftwareRegistryProvider implements SearchProvider {
  readonly name = 'Software & App Store Registries';
  readonly category = 'software';
  readonly tier = 2;

  async execute(candidateName: string): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const query = candidateName.trim();
    const cleanLower = query.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const softwareMatches: Omit<SoftwareMatch, 'id' | 'candidateId'>[] = [];
    const searchResults: ProviderExecutionResult['searchResults'] = [];

    // 1. Apple App Store (Official iTunes Search API)
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&limit=5`;
      const res = await fetch(itunesUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = (await res.json()) as { results: ItunesApp[] };
        for (const app of data.results || []) {
          const sim = compareNames(query, app.trackName);
          const matchType = sim.compositeScore >= 0.90 ? 'exact' : sim.compositeScore >= 0.70 ? 'similar' : 'partial';

          softwareMatches.push({
            name: app.trackName,
            platform: 'app_store',
            version: app.version,
            developer: app.artistName,
            url: app.trackViewUrl,
            matchType,
            category: app.primaryGenreName,
          });

          searchResults.push({
            sourceName: 'Apple App Store',
            sourceCategory: 'software',
            query,
            url: app.trackViewUrl,
            resultTitle: `${app.trackName} by ${app.artistName} (iOS/macOS)`,
            resultSnippet: `Category: ${app.primaryGenreName}. App version ${app.version}. Match similarity: ${(sim.compositeScore * 100).toFixed(0)}%.`,
            matchType,
            tier: 1,
            rawData: app as unknown as Record<string, unknown>,
          });
        }
      }
    } catch {
      // Ignore individual provider network timeout
    }

    // 2. npm Registry (Exact and Search)
    try {
      const npmExactUrl = `https://registry.npmjs.org/${encodeURIComponent(cleanLower)}`;
      const res = await fetch(npmExactUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const pkgData = (await res.json()) as { name: string; description?: string; 'dist-tags'?: { latest?: string } };
        softwareMatches.push({
          name: pkgData.name,
          platform: 'npm',
          version: pkgData['dist-tags']?.latest || '1.0.0',
          developer: 'npm registry publisher',
          url: `https://www.npmjs.com/package/${pkgData.name}`,
          matchType: 'exact',
          category: 'JavaScript/TypeScript Package',
        });

        searchResults.push({
          sourceName: 'npm Registry',
          sourceCategory: 'software',
          query: cleanLower,
          url: `https://www.npmjs.com/package/${pkgData.name}`,
          resultTitle: `npm package: "${pkgData.name}"`,
          resultSnippet: pkgData.description || 'Published package on npm package registry.',
          matchType: 'exact',
          tier: 2,
          rawData: { name: pkgData.name, version: pkgData['dist-tags']?.latest },
        });
      }
    } catch {
      // Ignore
    }

    // 3. PyPI (Python Package Index)
    try {
      const pypiUrl = `https://pypi.org/pypi/${encodeURIComponent(cleanLower)}/json`;
      const res = await fetch(pypiUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = (await res.json()) as { info: { name: string; summary?: string; version: string; author?: string; home_page?: string } };
        softwareMatches.push({
          name: data.info.name,
          platform: 'pypi',
          version: data.info.version,
          developer: data.info.author || 'PyPI Maintainer',
          url: `https://pypi.org/project/${data.info.name}/`,
          matchType: 'exact',
          category: 'Python Package',
        });

        searchResults.push({
          sourceName: 'PyPI (Python Package Index)',
          sourceCategory: 'software',
          query: cleanLower,
          url: `https://pypi.org/project/${data.info.name}/`,
          resultTitle: `PyPI project: "${data.info.name}" (${data.info.version})`,
          resultSnippet: data.info.summary || 'Published Python software library.',
          matchType: 'exact',
          tier: 2,
          rawData: { name: data.info.name, version: data.info.version },
        });
      }
    } catch {
      // Ignore
    }

    // 4. GitHub Repositories
    try {
      const ghUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(cleanLower)}&per_page=3`;
      const res = await fetch(ghUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'NameDiscoveryEngine/1.0',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = (await res.json()) as { items?: { name: string; full_name: string; html_url: string; description?: string; stargazers_count: number }[] };
        for (const repo of data.items || []) {
          const sim = compareNames(query, repo.name);
          const matchType = sim.compositeScore >= 0.90 ? 'exact' : 'similar';

          softwareMatches.push({
            name: repo.full_name,
            platform: 'github',
            developer: repo.full_name.split('/')[0],
            url: repo.html_url,
            matchType,
            category: `Open Source Repo (${repo.stargazers_count} stars)`,
          });

          searchResults.push({
            sourceName: 'GitHub Repositories',
            sourceCategory: 'software',
            query: cleanLower,
            url: repo.html_url,
            resultTitle: `${repo.full_name} (${repo.stargazers_count} stars)`,
            resultSnippet: repo.description || 'Open-source software repository on GitHub.',
            matchType,
            tier: 2,
            rawData: repo as unknown as Record<string, unknown>,
          });
        }
      }
    } catch {
      // Ignore
    }

    return {
      providerName: this.name,
      category: this.category,
      tier: this.tier,
      success: true,
      durationMs: Date.now() - startTime,
      searchResults,
      softwareMatches,
    };
  }
}
