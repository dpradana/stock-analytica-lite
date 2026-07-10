const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

async function run() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const formatSec = (d) => Math.floor(d.getTime() / 1000);

  try {
    console.log("Testing 1D (24h) with 15m interval...");
    const res1D = await yahooFinance.chart('BBRI.JK', {
      period1: formatSec(oneDayAgo),
      period2: formatSec(now),
      interval: '15m'
    });
    console.log("1D count:", res1D.quotes.length, "First sample:", res1D.quotes[0]);

    console.log("\nTesting 1W with 1h interval...");
    const res1W = await yahooFinance.chart('BBRI.JK', {
      period1: formatSec(oneWeekAgo),
      period2: formatSec(now),
      interval: '1h'
    });
    console.log("1W count:", res1W.quotes.length, "First sample:", res1W.quotes[0]);

    console.log("\nTesting 1M with 1d interval...");
    const res1M = await yahooFinance.chart('BBRI.JK', {
      period1: formatSec(oneMonthAgo),
      period2: formatSec(now),
      interval: '1d'
    });
    console.log("1M count:", res1M.quotes.length, "First sample:", res1M.quotes[0]);

    console.log("\nTesting 1Y with 1d interval...");
    const res1Y = await yahooFinance.chart('BBRI.JK', {
      period1: formatSec(oneYearAgo),
      period2: formatSec(now),
      interval: '1d'
    });
    console.log("1Y count:", res1Y.quotes.length, "First sample:", res1Y.quotes[0]);

  } catch (err) {
    console.error("Error:", err);
  }
}

run();
