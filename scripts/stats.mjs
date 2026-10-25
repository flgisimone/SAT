// npm run stats: this week's numbers for plan/lancio/metriche.md, from public APIs, without a token.
// npm downloads of the last week, the version on npm, and stars, forks and open issues on GitHub.
// ponytail: no repository traffic (views, referrers): GitHub's API needs a token for it; read it from Insights → Traffic.
const PACKAGE = 'seo-accessibility-tool';
const REPO = 'flgisimone/SAT';

async function get(url) {
    let response;
    try {
        response = await fetch(url, { headers: { 'user-agent': 'sat-stats' } });
    } catch (error) {
        throw new Error(`can't reach ${new URL(url).host} (${error.cause?.code ?? error.message}): check the network and try again`);
    }
    if (!response.ok) throw new Error(`${url} answered ${response.status}${response.status === 403 ? ' (GitHub rate limit: 60 requests an hour without a token, try later)' : ''}`);
    return response.json();
}

try {
    const [downloads, latest, repo] = await Promise.all([
        get(`https://api.npmjs.org/downloads/point/last-week/${PACKAGE}`),
        get(`https://registry.npmjs.org/${PACKAGE}/latest`),
        get(`https://api.github.com/repos/${REPO}`),
    ]);
    // GitHub counts open pull requests among the open issues.
    const row = [`${downloads.start} – ${downloads.end}`, latest.version, downloads.downloads, repo.stargazers_count, repo.forks_count, repo.open_issues_count, '', ''];
    console.log(`| ${row.join(' | ')} |`);
} catch (error) {
    console.error(`npm run stats: ${error.message}`);
    process.exit(1);
}
