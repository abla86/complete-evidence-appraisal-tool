import { DomainResult } from '../../src/types/index.js';
import { ProviderExecutionResult, SearchProvider } from './types.js';

interface DnsResponse {
  Status: number; // 0 = NOERROR, 3 = NXDOMAIN
  Answer?: { name: string; type: number; TTL: number; data: string }[];
  Authority?: { name: string; type: number; TTL: number; data: string }[];
}

export class LiveDomainProvider implements SearchProvider {
  readonly name = 'Live Domain & RDAP Provider';
  readonly category = 'domain';
  readonly tier = 1;

  readonly supportedTLDs = ['.com', '.no', '.ai', '.app', '.io', '.dev', '.co'];

  async execute(candidateName: string): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const cleanBase = candidateName.toLowerCase().replace(/[^a-z0-9-]/g, '').trim();

    if (!cleanBase) {
      return {
        providerName: this.name,
        category: this.category,
        tier: this.tier,
        success: false,
        error: 'Invalid candidate name for domain check',
        durationMs: Date.now() - startTime,
        searchResults: [],
        domainResults: [],
      };
    }

    const domainResults: Omit<DomainResult, 'id' | 'candidateId'>[] = [];
    const searchResults: ProviderExecutionResult['searchResults'] = [];

    // Query each supported TLD
    for (const tld of this.supportedTLDs) {
      const domain = `${cleanBase}${tld}`;
      try {
        const check = await this.investigateDomain(domain, tld);
        domainResults.push(check);

        searchResults.push({
          sourceName: `Domain DNS/RDAP (${tld})`,
          sourceCategory: 'domain',
          query: domain,
          url: `https://${domain}`,
          resultTitle: `${domain} - ${check.status.replace('_', ' ').toUpperCase()}`,
          resultSnippet: check.notes,
          matchType: check.status === 'registered' ? 'exact' : 'none',
          tier: 1,
          rawData: check as unknown as Record<string, unknown>,
        });
      } catch {
        domainResults.push({
          domain,
          tld,
          status: 'unverifiable',
          queryTime: new Date().toISOString(),
          notes: 'Domain availability could not be verified.',
        });
      }
    }

    return {
      providerName: this.name,
      category: this.category,
      tier: this.tier,
      success: true,
      durationMs: Date.now() - startTime,
      searchResults,
      domainResults,
    };
  }

  private async investigateDomain(domain: string, tld: string): Promise<Omit<DomainResult, 'id' | 'candidateId'>> {
    const queryTime = new Date().toISOString();

    // 1. Query Cloudflare DoH for DNS records
    const dnsUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`;
    let dnsRes: DnsResponse | null = null;

    try {
      const resp = await fetch(dnsUrl, {
        headers: { 'Accept': 'application/dns-json' },
        signal: AbortSignal.timeout(4000),
      });
      if (resp.ok) {
        dnsRes = (await resp.json()) as DnsResponse;
      }
    } catch {
      // DNS check failed or timed out
    }

    // Also check NS records
    const nsUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`;
    let nsRes: DnsResponse | null = null;
    try {
      const resp = await fetch(nsUrl, {
        headers: { 'Accept': 'application/dns-json' },
        signal: AbortSignal.timeout(4000),
      });
      if (resp.ok) {
        nsRes = (await resp.json()) as DnsResponse;
      }
    } catch {
      // Ignore
    }

    const hasAnswer = (dnsRes?.Answer && dnsRes.Answer.length > 0) || (nsRes?.Answer && nsRes.Answer.length > 0);
    const nameservers = nsRes?.Answer?.map(a => a.data) || [];

    if (hasAnswer) {
      return {
        domain,
        tld,
        status: 'registered',
        nameservers,
        queryTime,
        notes: `Active DNS resolution detected with active nameservers/IP records (${nameservers.slice(0, 2).join(', ') || 'A/CNAME records active'}).`,
      };
    }

    // 2. If DNS is NXDOMAIN or has no answers, check RDAP (RFC 9083)
    if (tld === '.com') {
      try {
        const rdapUrl = `https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(domain)}`;
        const rdapResp = await fetch(rdapUrl, {
          signal: AbortSignal.timeout(4000),
        });

        if (rdapResp.status === 200) {
          const rdapData = (await rdapResp.json()) as { ldhName?: string };
          return {
            domain,
            tld,
            status: 'registered',
            queryTime,
            notes: `Registered in Verisign .com registry (RDAP registration confirmed).`,
          };
        } else if (rdapResp.status === 404) {
          return {
            domain,
            tld,
            status: 'unregistered_likely',
            queryTime,
            notes: `RDAP 404 Not Found & DNS NXDOMAIN. Appears preliminarily unregistered (subject to registry restrictions).`,
          };
        }
      } catch {
        // RDAP check inconclusive
      }
    }

    // If NXDOMAIN (Status = 3) on DNS
    if (dnsRes?.Status === 3) {
      return {
        domain,
        tld,
        status: 'unregistered_likely',
        queryTime,
        notes: `DNS returned NXDOMAIN. Domain is likely unregistered or dormant (verification via certified registrar recommended).`,
      };
    }

    // If live checking is unavailable or inconclusive:
    return {
      domain,
      tld,
      status: 'unverifiable',
      queryTime,
      notes: 'Domain availability could not be verified.',
    };
  }
}
