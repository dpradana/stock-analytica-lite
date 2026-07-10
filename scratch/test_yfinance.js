const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

async function run() {
  try {
    console.log("Fetching chart for 'BBRI.JK'...");
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    // Test chart method
    const chartRes = await yahooFinance.chart('BBRI.JK', {
      period1: Math.floor(oneMonthAgo.getTime() / 1000), // Yahoo expects seconds timestamp for chart
      period2: Math.floor(today.getTime() / 1000),
      interval: '1d'
    });
    
    console.log("Chart keys:", Object.keys(chartRes));
    console.log("Quotes count:", chartRes.quotes.length);
    console.log("Sample quote:", chartRes.quotes[0]);
    console.log("Meta:", chartRes.meta);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
