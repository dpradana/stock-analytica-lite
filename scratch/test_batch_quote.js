const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

async function run() {
  try {
    const q = 'TLKM';
    console.log(`Searching for '${q}'...`);
    const searchRes = await yahooFinance.search(q);
    const validQuotes = searchRes.quotes.filter(item => item.symbol && item.isYahooFinance);
    const symbols = validQuotes.slice(0, 5).map(item => item.symbol);
    console.log("Matching symbols:", symbols);

    if (symbols.length > 0) {
      console.log(`Fetching quotes for symbols: ${symbols.join(', ')}...`);
      const quotesRes = await yahooFinance.quote(symbols);
      // If it is a single result, yahooFinance.quote returns an object, if multiple it returns an array
      const quotes = Array.isArray(quotesRes) ? quotesRes : [quotesRes];
      
      const mapped = validQuotes.slice(0, 5).map(item => {
        const quote = quotes.find(q => q.symbol === item.symbol);
        return {
          symbol: item.symbol,
          name: item.longname || item.shortname || item.symbol,
          price: quote ? quote.regularMarketPrice : undefined,
          change: quote ? quote.regularMarketChange : undefined,
          changePercent: quote ? quote.regularMarketChangePercent : undefined,
          currency: quote ? quote.currency : 'USD',
          sector: item.sector || quote?.sector || 'Unknown'
        };
      });
      console.log("Mapped results:", JSON.stringify(mapped, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
