const axios = require("axios");

const ETHUSDPool = "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852";
const poolAddress = "0x9eb51eb22813ee077e7ef4739a68d8e0b8e67cc6";

const GRAPH_ENDPOINT =
  "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v2-dev";

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;

const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // miliseconds

// handling block numbers
async function getBlockNumberForDate(date, retries = 0) {
  const timestamp = Math.floor(date.getTime() / 1000);
  const url = `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=${ETHERSCAN_API_KEY}}`;

  try {
    const res = await axios.get(url);
    if (res.data.status === "1") {
      return res.data.result;
    } else {
      throw new Error(res.data.message);
    }
  } catch (error) {
    console.error("Error fetching block number:", error.message);
    if (retries < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return getBlockNumberForDate(date, retries + 1);
    } else {
      console.error("Max retries reached. Returning null.");
      return null;
    }
  }
}

async function getRecentBlockNumbers() {
  const now = new Date();

  // 30 minutes ago
  const thirtyMinAgo = new Date(now - 30 * 60 * 1000);
  const blockThirtyMinAgo = await getBlockNumberForDate(thirtyMinAgo);

  // 1 hour ago
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const blockOneHourAgo = await getBlockNumberForDate(oneHourAgo);

  // 24 hours ago
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const blockOneDayAgo = await getBlockNumberForDate(oneDayAgo);

  return {
    blockThirtyMinAgo,
    blockOneHourAgo,
    blockOneDayAgo,
  };
}

const fetchPricesForBlock = async (blockNumber) => {
  const blockArgument = blockNumber !== undefined ? blockNumber : "";

  const query = `
    {
      uniPair: pair(id: "${poolAddress}", block: {number: ${blockArgument}}) {
        token0Price
        token1Price
      }
      ethUsdtPair: pair(id: "${ETHUSDPool}", block: {number: ${blockArgument}}) {
        token0Price
        token1Price
        token0 {
          symbol
        }
      }
    }
  `;

  const response = await axios.post(GRAPH_ENDPOINT, { query });
  const data = response.data.data;

  if (!data || !data.ethUsdtPair) {
    console.error("Invalid or missing data in response:", data);
    return null;
  }

  let ethPriceInUsdt;

  if (
    data.ethUsdtPair.token0.symbol === "ETH" ||
    data.ethUsdtPair.token0.symbol === "WETH"
  ) {
    ethPriceInUsdt = data.ethUsdtPair.token1Price;
  } else {
    ethPriceInUsdt = data.ethUsdtPair.token0Price;
  }

  const uniToken0Price = data.uniPair.token0Price;

  return {
    ethPriceInUSDT: ethPriceInUsdt,
    uniToken0Price: uniToken0Price,
    uniToken1PriceInUSDT: (1 / uniToken0Price) * ethPriceInUsdt,
  };
};

async function fetchHistoricalPrices() {
  const { blockThirtyMinAgo, blockOneHourAgo, blockOneDayAgo } =
    await getRecentBlockNumbers();

  if (!blockThirtyMinAgo || !blockOneHourAgo || !blockOneDayAgo) {
    console.error("Failed to fetch block numbers. Exiting...");
    return null;
  }

  const price30MinAgo = await fetchPricesForBlock(blockThirtyMinAgo);
  const price1HourAgo = await fetchPricesForBlock(blockOneHourAgo);
  const price24HoursAgo = await fetchPricesForBlock(blockOneDayAgo);

  return {
    price30MinAgo,
    price1HourAgo,
    price24HoursAgo,
  };
}

fetchHistoricalPrices().then(console.log);

module.exports = fetchHistoricalPrices;
