import dotenv from 'dotenv'
dotenv.config()

import {ERC20_ABI} from './abi/erc20'
import {UNISWAPV2_FACTORY_ABI} from './abi/uniswapv2-factory'
import {UNISWAPV3_FACTORY_ABI} from './abi/uniswapv3-factory'
import { UNISWAP_V2_ROUTER_ABI } from "./abi/uniswapv2-router"
import { UNISWAP_V3_ROUTER_ABI } from "./abi/uniswapv3-router"
import * as uniconst from './uniconst'
import * as utils from './utils'
import Web3 from 'web3'
import { ethers, providers, Wallet, BigNumber } from 'ethers'
import { UNISWAP_V2_FACTORY_BYTECODE } from './bytecode/uniswapv2-factory'
import { UNISWAP_V3_FACTORY_BYTECODE } from './bytecode/uniswapv3-factory'
import { UNISWAP_V3_POOL_ABI } from './abi/uniswapv3-pool'
import { UNISWAP_V3_NONFUNGIBLE_POSITION_MANAGER_ABI } from './abi/uniswapv3-nonfungiblePositionManager'
import { UNISWAP_V2_POOL_ABI } from './abi/uniswapv2-pool-abi'

enum Chains {
    Mainnet = 1,
    Goerli = 5,
    Base_Sepolia = 84532
}
export const NOT_ASSIGNED = '- Not assigned -'

export const PAYMENT_ADDRESS = process.env.PAYMENT_ADDRESS

export const rankingEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

export const errorLog = (summary: string, error: any): void => {
    if (error?.response?.body?.description) {
        console.log('\x1b[31m%s\x1b[0m', `[error] ${summary} ${error.response.body.description}`);
    } else {
        console.log('\x1b[31m%s\x1b[0m', `[error] ${summary} ${error}`);
    }
};

export const parseError = (error: any): string => {
    let msg = '';
    try {
        error = JSON.parse(JSON.stringify(error));
        msg =
            error?.error?.reason ||
            error?.reason ||
            JSON.parse(error)?.error?.error?.response?.error?.message ||
            error?.response ||
            error?.message ||
            error;
    } catch (_error) {
        msg = error;
    }

    return msg;
};

export let FREE_TO_USE = Number(process.env.FREE_TO_USE)

export const EthereumMainnet_ChainId = 1
export const GoerliTestnet_ChainId = 5
export const BinanceSmartChainMainnet_ChainId = 56
export const Avalanche_ChainId = 43114
export const PolygonMainnet_ChainId = 137

export const TradingMonitorDuration = 24 * 60 * 60
export const Max_Sell_Count = 10
export const Swap_Fee_Percent = Number(process.env.BOT_FEE_PERCENT)
// export const Reward_Percent = Number(process.env.BOT_REWARD_PERCENT)
export const Default_Swap_Heap = 0.001
export const ETHER = BigNumber.from(10).pow(18)
export const GWEI = BigNumber.from(10).pow(9)
export const DEFAULT_GAS_LIMIT = 700_000

export const Mainnet = 'mainnet-beta'
export const Testnet = 'testnet'
export const Devnet = 'devnet'

export let web3Conn : Web3
export let ethersConn : any
export let provider: any;
export let quoteToken: any;

export const init = async () => {
    quoteToken = await utils.getTokenInfo(uniconst.WETH_ADDRESS)
}

export const setWeb3 = (conn: Web3) => {

	web3Conn = conn
    provider = new providers.WebSocketProvider(get_ethereum_rpc_socket_url())
}

export const setETHs = (conn: any) => {

	ethersConn = conn
}

export const get_flashbot_rpc_url = () : string => { 

    switch (get_net_mode()) {
        case Chains.Mainnet: {
            return process.env.FLASHBOTS_ENDPOINT as string
        }
        case Chains.Goerli: {
            return process.env.GOERLI_FLASHBOTS_ENDPOINT as string
        }
    }
    return ''
}

export const get_ethereum_rpc_socket_url = () : string => { 

    switch (get_net_mode()) {
        case Chains.Mainnet: {
            return process.env.MAINNET_RPC_SOCKET as string
        }
        case Chains.Goerli: {
            return process.env.GOERLINET_RPC_SOCKET as string
        }
        case Chains.Base_Sepolia: {
            return process.env.BASE_SEPOLIA_RPC_SOCKET as string
        }
    }
    return ''
}

export const get_ethereum_rpc_http_url = () : string => { 

    switch (get_net_mode()) {
        case Chains.Mainnet: {
            return process.env.MAINNET_RPC as string
        }
        case Chains.Goerli: {
            return process.env.GOERLINET_RPC as string
        }
        case Chains.Base_Sepolia: {
            return process.env.BASE_SEPOLIA_RPC as string
        }
    }

    return ''
}

export const get_bot_link = () => {

	return `https://t.me/${process.env.BOT_USERNAME}`
}

export const get_net_mode = () => {

	return Number(process.env.NET_MODE)
}

export const get_chainscan_url = (url: string): string => {

    switch (get_net_mode()) {
        case Chains.Mainnet: {
            return `https://etherscan.io/${url}`
        }
        case Chains.Goerli: {
            return `https://goerli.etherscan.io/${url}`
        }
    }

    return ''
};

export const get_ERC20_abi = () => {

    switch (get_chain_id()) {
		case BinanceSmartChainMainnet_ChainId: {

			// return BEP20_ABI;
		}
		case Avalanche_ChainId: {
			return ERC20_ABI;
		}
		default: {
			return ERC20_ABI;
		}
	}
}

export const get_uniswapv2_factory_abi = () => {
    return UNISWAPV2_FACTORY_ABI
}

export const get_uniswapv3_factory_abi = () => {
    return UNISWAPV3_FACTORY_ABI
}

export const get_uniswapv2_router_abi = () => {
    return UNISWAP_V2_ROUTER_ABI
}
export const get_uniswapv2_factory_bytecode = () => {
    return UNISWAP_V2_FACTORY_BYTECODE
}
export const get_uniswapv3_factory_bytecode = () => {
    return UNISWAP_V3_FACTORY_BYTECODE
}
export const get_uniswapv3_router_abi = () => {
    return UNISWAP_V3_ROUTER_ABI
}
export const get_uniswapv3_pool_abi = () => {
    return UNISWAP_V3_POOL_ABI
}
export const get_uniswapv3_nf_pos_manager_abi = () => {
    return UNISWAP_V3_NONFUNGIBLE_POSITION_MANAGER_ABI
}
export const get_dexscreener_url = (tokenAddress: string): string => {
    
    let prefix = `https://dexscreener.com/solana/${tokenAddress}`;

    return prefix
};



export const get_uniswapv2_router_address = () => {

    switch (get_chain_id()) {
		case BinanceSmartChainMainnet_ChainId: {

			return uniconst.PancakeswapV2RouterAddress;
		}
		case Avalanche_ChainId: {

			return uniconst.JoeV2RouterAddress;
		}
		default: {

			return uniconst.uniswapV2RouterAddress
		}
	}
}

export const get_chain_id = () => {

    return Number(process.env.CHAIN_MODE)
}

export const get_weth_address = () => {

	switch (get_chain_id()) {
		case BinanceSmartChainMainnet_ChainId: {

			return uniconst.WBNB_ADDRESS;
		}

		case Avalanche_ChainId: {

			return uniconst.WAVAX_ADDRESS;
		}

		case GoerliTestnet_ChainId: {

			return uniconst.GOERLI_WETH_ADDRESS
		}

		default: {

			return uniconst.WETH_ADDRESS
		}
	}
}

export const get_uniswapv2_pool_abi = () => { 

	switch (get_chain_id()) {
		case BinanceSmartChainMainnet_ChainId: {

			return UNISWAP_V2_POOL_ABI;//PANCAKESWAP_V2_POOL_ABI;
		}
		case Avalanche_ChainId: {
			return UNISWAP_V2_POOL_ABI;//JOE_V2_POOL_ABI;
		}
		default: {

			return UNISWAP_V2_POOL_ABI;
		}
	}
}


export const get_chain_symbol = () => {

	switch (get_chain_id()) {
		case BinanceSmartChainMainnet_ChainId: {

			return 'BSC'
		}
		case Avalanche_ChainId: {
			return 'AVAX'
		}
		default: {

			return 'ETH'
		}
	}
}