
import * as bot from "./bot"
import { OptionCode } from "./bot"
import * as utils from './utils'
import * as database from './db'
import * as afx from './global'
import { DelayDetector } from "./delay_detector"
import * as swapManager from './swap_manager'

import dotenv from 'dotenv'
import Web3 from 'web3'
import { ethers } from "ethers";
import * as poolDetector from "./liquidity_detector"
dotenv.config()

import * as autoTrader from './auto_trader'

export const web3 = new Web3(new Web3.providers.WebsocketProvider(afx.get_ethereum_rpc_socket_url()))
export const web3Http = new Web3(afx.get_ethereum_rpc_http_url());
export const ethersHttp = new ethers.providers.JsonRpcProvider(afx.get_ethereum_rpc_http_url())
afx.setWeb3(web3)
afx.setETHs(ethersHttp)
afx.init()

bot.init(async (session: any, command: string, params: any, messageId: number) => {



}, async (option: number, param: any) => {

    if (option === OptionCode.MSG_GETTOKENINFO) {
        const session = param.session
        const address = param.address

        const menu: any = await bot.json_msg(session.chatid, address)
        if (menu) {
            await bot.sendOptionMessage(session.chatid, menu.title, menu.options)
        }
    }
})


const performSnipping = async (web3: any, tokenInfo: any, version: any) => {
	try {
		console.log("SniperStart");
		const tokens = await database.selectTokenSnipping({})
		const primaryAddressLo = tokenInfo.primaryAddress.toLowerCase()

		const primaryContract = new web3.eth.Contract(afx.get_ERC20_abi(), tokenInfo.primaryAddress)
		const secondaryContract = new web3.eth.Contract(afx.get_ERC20_abi(), tokenInfo.secondaryAddress)
		const primaryInfo = await utils.getTokenInfo(tokenInfo.primaryAddress)
		const secondaryInfo = await utils.getTokenInfo(tokenInfo.secondaryAddress)
		let poolContract: any
		if (tokenInfo.version === 'v2') {
			poolContract = new web3.eth.Contract(afx.get_uniswapv2_pool_abi(), tokenInfo.poolAddress)
		} else {//if (tokenInfo.version === 'v3') {
			poolContract = new web3.eth.Contract(afx.get_uniswapv3_pool_abi(), tokenInfo.poolAddress)
		}
		let currentPrimaryAmount = await primaryContract.methods.balanceOf(tokenInfo.poolAddress).call()
		currentPrimaryAmount = Number(currentPrimaryAmount)
		if (currentPrimaryAmount === 0) {
			console.log("pool hasn't any token");
			return;
		}
		let currentSecondaryAmount = await secondaryContract.methods.balanceOf(tokenInfo.poolAddress).call()
		currentSecondaryAmount = Number(currentSecondaryAmount)
		const primaryPriceBySecondary = currentSecondaryAmount / currentPrimaryAmount * 10 ** (Number(primaryInfo.decimal) - Number(secondaryInfo.decimal))
		// const secondaryPriceByUSD = await filter.getSecondaryTokenPrice(web3, tokenInfo.secondaryAddress)
		// const primaryPriceByUSD = primaryPriceBySecondary * secondaryPriceByUSD
		let currentLiquidity = currentSecondaryAmount
		console.log("SniperStart calc end");
		// currentLiquidity = currentLiquidity / 10 ** Number(secondaryInfo.decimal) * secondaryPriceByUSD;

		// const marketCap = primaryInfo.totalSupply * primaryPriceByUSD
		// const tokenTax = await advUtils.getTokenTax(web3, [afx.get_weth_address(), tokenInfo.primaryAddress])

		console.log("SniperStart manual");
		let manual_users: any = []
		for (const token of tokens) {

			if (token.address === primaryAddressLo) {

				const session = bot.sessions.get(token.chatid)
				if (session /*&& session.snipe_manual*/) {
					// const tokenAutoTrades = await database.selectAutoSellTokens({chatid: session.chatid})
					// if (tokenAutoTrades.length >= afx.Max_Auto_Trading_Count) {
					// 	continue;
					// }
					// if (session.snipe_max_buy_tax >= 0 && tokenTax.buyTax > session.snipe_max_buy_tax) {
					// 	continue;
					// }
					// if (session.snipe_max_sell_tax >= 0 && tokenTax.sellTax > session.snipe_max_sell_tax) {
					// 	continue;
					// }
					// if (tokenTax.buyTax > session.snipe_max_buy_tax || tokenTax.sellTax > session.snipe_max_sell_tax) {
					// 	bot.sendMessage(session.chatid, `😢 Sorry, This token has ${tokenTax.buyTax} % buy tax, so you might need to increase the slippage.`)
					// 	continue;
					// }
					manual_users.push(session.chatid)
					bot.sendMessage(session.chatid, `✴️ Auto Sniper triggered.
					Name: ${token.name} (${token.symbol})
					Token Address: <code>${tokenInfo.primaryAddress}</code>
					Pair Address: <code>${tokenInfo.poolAddress}</code>
					Amount: ${utils.roundDecimal(token.eth_amount, 2)} ${afx.get_chain_symbol()}`)

					await autoTrader.autoSwap_Buy(web3Http, database, bot, session, tokenInfo.primaryAddress, token.eth_amount, afx.get_chain_symbol(), version)
					// const autoSell_Count = await database.countAutoSellTokens({chatid: session.chatid});
					// if (session.snipe_use_autosell && autoSell_Count < afx.Max_Sell_Count) {
					// 	await database.addAutoSellToken(session.chatid, tokenInfo.primaryAddress, primaryInfo.name, primaryInfo.symbol, tokenInfo.decimal, primaryPriceBySecondary)
					// }
				}
			}
		}
		// console.log("SniperStart auto", tokenTax);
		// for (const [chatid, session] of bot.sessions) {
		// 	if (!session.snipe_auto) {
		// 		continue;
		// 	}
		// 	let isManual = false;
		// 	for (const manual_user of manual_users) {
		// 		if (manual_user === chatid) {
		// 			isManual = true;
		// 			break;
		// 		}
		// 	}
		// 	if (isManual) {
		// 		continue;
		// 	}
		// 	// const tokenAutoTrades = await database.selectAutoSellTokens({chatid: session.chatid})
		// 	// if (tokenAutoTrades.length >= afx.Max_Auto_Trading_Count) {
		// 	// 	continue;
		// 	// }
		// 	if (session.snipe_min_mc && session.snipe_min_mc > marketCap) {
		// 		continue;
		// 	}
		// 	if (session.snipe_max_mc && session.snipe_max_mc < marketCap) {
		// 		continue;
		// 	}
		// 	if (session.snipe_min_liq && session.snipe_min_liq > currentLiquidity) {
		// 		continue;
		// 	}
		// 	if (session.snipe_max_liq && session.snipe_max_liq < currentLiquidity) {
		// 		continue;
		// 	}
		// 	if (session.snipe_max_buy_tax >= 0 && tokenTax.buyTax > session.snipe_max_buy_tax) {
		// 		continue;
		// 	}
		// 	if (session.snipe_max_sell_tax >= 0 && tokenTax.sellTax > session.snipe_max_sell_tax) {
		// 		continue;
		// 	}
		// 	if (tokenTax.buyTax > session.wallets[session.wallets_index].snipe_buy_slippage  || tokenTax.sellTax > session.wallets[session.wallets_index].snipe_max_sell_tax) {
		// 		bot.sendMessage(session.chatid, `😢 Sorry, This token has ${tokenTax.buyTax}% buy tax, so you might need to increase the slippage.`)
		// 		continue;
		// 	}
		// 	bot.sendMessage(session.chatid, `✴️ Auto Snippet triggered.
		// 		Name: ${primaryInfo.name} (${primaryInfo.symbol})
		// 		Token Address: <code>${tokenInfo.primaryAddress}</code>
		// 		Pair Address: <code>${tokenInfo.poolAddress}</code>
		// 		Amount: ${utils.roundDecimal(session.snipe_auto_amount, 2)} ${afx.get_chain_symbol()}`)
		// 	//RJM
		// 	if (session.snipe_auto_amount === 0) {
		// 		return;
		// 	}
		// 	await autoTrader.autoSwap_Buy(web3Http, database, bot, session, tokenInfo.primaryAddress, session.snipe_auto_amount, afx.get_chain_symbol(), version)
		// 	const autoSell_Count = await database.countAutoSellTokens({chatid: session.chatid});
		// 	if (session.snipe_use_autosell && autoSell_Count < afx.Max_Sell_Count) {
		// 		await database.addAutoSellToken(session.chatid, tokenInfo.primaryAddress, primaryInfo.name, primaryInfo.symbol, tokenInfo.decimal, primaryPriceBySecondary)
		// 	}
		// }
		// console.log("SniperStart auto ends");

	} catch (error) {
		console.log("snipping error", error);
	}
}

// poolDetector.startPendingTrxListener(web3)
poolDetector.startCreatePoolEventListener(web3, async (tokenInfo: any, ver: any) => {
    if (tokenInfo.version === 'v2') {
        performSnipping(web3, tokenInfo, ver)
		// checkReliableToken(web3, tokenInfo, ver);
    }
})


// poolDetector.testModule(web3)
// import {aesCreateKey} from './aes'

// console.log(aesCreateKey())

//  const pkey='UBtRfkSFonncumBAV0upwSxVuTGDDWmpggsRA48Pct2rJwBOH03wlA0s1IPRhfOEWatx9c+JtlEkXzh9nngXj/e0mFdxvXHB/mrHu6kEN3g='
//  console.log(utils.decryptPKey(pkey))