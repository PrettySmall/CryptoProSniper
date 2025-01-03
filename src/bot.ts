

import assert from 'assert';
import dotenv from 'dotenv'
dotenv.config()

import * as database from './db'
import * as privateBot from './bot_private'
import * as afx from './global'
import * as utils from './utils'
import * as swapManager from './swap_manager'
import * as uniconst from './uniconst'


import TelegramBot from 'node-telegram-bot-api'

export const COMMAND_START = 'start'
export const COMMAND_HOME = 'home'
export const COMMAND_WALLET = 'wallet'
export const COMMAND_SNIPE = 'snipe'
export const COMMAND_PROMOTE_VIP = 'vip'

export enum OptionCode {
	BACK = -100,
	CLOSE,
	TITLE,
	WELCOME = 0,
	MAIN_MENU,
	MAIN_SNIPE,
	MAIN_AUTO_SNIPER,
	MAIN_MANUAL_BUYER,
	MAIN_SET_MANUAL_BUYER_PARAM,
	MAIN_SETTINGS,
	MAIN_PENDING_SNIPE,
	MAIN_SETUP_LIMIT_ORDER,
	MAIN_TOKEN_BONUS,	
	MAIN_HELP,
	MAIN_WALLET,
	MAIN_REFRESH,

	MANUAL_BUYER_CHANGE_CHAIN,
	MANUAL_BUYER_CHANGE_WALLET,	
	MANUAL_BUYER_GWEI,
	MANUAL_BUYER_BUY_01,
	MANUAL_BUYER_BUY_02,
	MANUAL_BUYER_BUY_05,
	MANUAL_BUYER_BUY_1,
	MANUAL_BUYER_BUY_2,
	MANUAL_BUYER_BUY_5,
	MANUAL_BUYER_BUY_X,
	MANUAL_BUYER_ANTI_RUG,
	MANUAL_BUYER_TRANSFER_BLACKLIST,
	MANUAL_BUYER_SLIPPAGE,
	MANUAL_BUYER_LIMIT_ORDER,
	MANUAL_BUYER_PRE_APPROVE,
	MANUAL_BUYER_MANUAL_SETTING,	

	WALLET_ETHERSCAN,
	WALLET_DEPOSIT_ETH,
	WALLET_WITHDRAW_ALL_ETH,
	WALLET_WITHDRAW_X_ETH,
	WALLET_RESET_WALLET,
	WALLET_EXPORT_KEY,
	WALLET_REFRESH,
	WALLET_RESET_WALLET_CONFIRM,
	WALLET_IMPORT_KEY,
	WALLET_IMPORT_KEY_CONFIRM,
	WALLET_EXPORT_KEY_CONFIRM,
	WALLET_WITHDRAW_CONFIRM,

	SNIPE_SLIPPAGE_BUY,
	SNIPE_GAS_DELTA,
	SNIPE_MEV_PROTECT,
	SNIPE_TRX_PRIORITY,
	SNIPE_TRX_PRIORITY_VALUE,
	SNIPE_ADD_TOKEN,
	SNIPE_TOKEN_LIST,
	SNIPE_TOKEN_REMOVE,
	SNIPE_TOKEN_REMOVEALL,

	MSG_GETTOKENINFO,
	MSG_ADD_SNIPE,
	MSG_REFRESH,

	SETTING_SECURITY_PIN_SETTINGS,
	SETTING_GAS_SETTINGS,
	SETTING_WALLET_SETTINGS,
	SETTING_SAFETY_SETTINGS,
	SETTING_TOGGLE_SETTINGS,
	SETTING_PRESETS_SETTINGS,
	SETTING_OVERVIEW,
	SETTING_CHAIN_SETTINGS,
}

export enum StateCode {
	IDLE = 1000,
	WAIT_SET_WALLET_WITHDRAW_ADDRESS,
	WAIT_SET_SNIPE_SLIPPAGE_BUY,
	WAIT_SET_SNIPE_GAS_DELTA,
	WAIT_SET_SNIPE_TRXPRIORITY_VALUE,
	WAIT_SET_SNIPE_TOKEN_ADDRESS,
	WAIT_SET_WALLET_IMPORT_PKEY,
	WAIT_SET_WALLET_WITHDRAW_AMOUNT,
	WAIT_SET_MSG_BUYXAMOUNT,
	WAIT_ADD_SNIPING_TOKEN,

	WAIT_SET_SNIPE_AMOUNT,
	WAIT_SET_SNIPE_TIP_AMOUNT,

	WAIT_ADD_MANUAL_BUYER_TOKEN,
}

export let bot: TelegramBot
export let myInfo: TelegramBot.User
export const sessions = new Map()
export const stateMap = new Map()

export const stateMap_setFocus = (chatid: string, state: any, data: any = {}) => {

	let item = stateMap.get(chatid)
	if (!item) {
		item = stateMap_init(chatid)
	}

	if (!data) {
		let focusData = {}
		if (item.focus && item.focus.data) {
			focusData = item.focus.data
		}

		item.focus = { state, data: focusData }
	} else {
		item.focus = { state, data }
	}

	// stateMap.set(chatid, item)
}

export const stateMap_getFocus = (chatid: string) => {
	const item = stateMap.get(chatid)
	if (item) {
		let focusItem = item.focus
		return focusItem
	}

	return null
}

export const stateMap_init = (chatid: string) => {

	let item = {
		focus: { state: StateCode.IDLE, data: { sessionId: chatid } },
		message: new Map()
	}

	stateMap.set(chatid, item)

	return item
}

export const stateMap_setMessage_Id = (chatid: string, messageType: number, messageId: number) => {

	let item = stateMap.get(chatid)
	if (!item) {
		item = stateMap_init(chatid)
	}

	item.message.set(`t${messageType}`, messageId)
	//stateMap.set(chatid, item)
}

export const stateMap_getMessage = (chatid: string) => {
	const item = stateMap.get(chatid)
	if (item) {
		let messageItem = item.message
		return messageItem
	}

	return null
}

export const stateMap_getMessage_Id = (chatid: string, messageType: number) => {
	const messageItem = stateMap_getMessage(chatid)
	if (messageItem) {

		return messageItem.get(`t${messageType}`)
	}

	return null
}

export const stateMap_get = (chatid: string) => {
	return stateMap.get(chatid)
}

export const stateMap_remove = (chatid: string) => {
	stateMap.delete(chatid)
}

export const stateMap_clear = () => {
	stateMap.clear()
}

const json_buttonItem = (key: string, cmd: number, text: string) => {
	return {
		text: text,
		callback_data: JSON.stringify({ k: key, c: cmd }),
	}
}

const json_url_buttonItem = (text: string, url: string) => {
	return {
		text: text,
		url: url,
	}
}

const json_webapp_buttonItem = (text: string, url: any) => {
	return {
		text: text,
		web_app: {
			url
		}
	}
}

export const removeMenu = async (chatId: string, messageType: number) => {

	const msgId = stateMap_getMessage_Id(chatId, messageType)

	if (msgId) {

		try {

			await bot.deleteMessage(chatId, msgId)

		} catch (error) {
			//afx.errorLog('deleteMessage', error)
		}
	}
}

export const openMenu = async (chatId: string, messageType: number, menuTitle: string, json_buttons: any = []) => {

	const keyboard = {
		inline_keyboard: json_buttons,
		resize_keyboard: true,
		one_time_keyboard: true,
		force_reply: true
	};

	return new Promise(async (resolve, reject) => {

		await removeMenu(chatId, messageType)

		try {

			let msg: TelegramBot.Message = await bot.sendMessage(chatId, menuTitle, { reply_markup: keyboard, parse_mode: 'HTML', disable_web_page_preview: true });

			stateMap_setMessage_Id(chatId, messageType, msg.message_id)
			// console.log('chatId, messageType, msg.message_id', chatId, messageType, msg.message_id)
			resolve({ messageId: msg.message_id, chatid: msg.chat.id })

		} catch (error) {
			afx.errorLog('openMenu', error)
			resolve(null)
		}
	})
}

export const openMessage = async (chatId: string, bannerId: string, messageType: number, menuTitle: string) => {

	return new Promise(async (resolve, reject) => {

		await removeMenu(chatId, messageType)

		let msg: TelegramBot.Message

		try {

			if (bannerId) {

				msg = await bot.sendPhoto(chatId, bannerId, { caption: menuTitle, parse_mode: 'HTML' });

			} else {

				msg = await bot.sendMessage(chatId, menuTitle, { parse_mode: 'HTML', disable_web_page_preview: true });
			}

			stateMap_setMessage_Id(chatId, messageType, msg.message_id)
			// console.log('chatId, messageType, msg.message_id', chatId, messageType, msg.message_id)
			resolve({ messageId: msg.message_id, chatid: msg.chat.id })

		} catch (error) {
			afx.errorLog('openMenu', error)
			resolve(null)
		}
	})
}

async function switchMenu(chatId: string, messageId: number, title: string, json_buttons: any) {

	const keyboard = {
		inline_keyboard: json_buttons,
		resize_keyboard: true,
		one_time_keyboard: true,
		force_reply: true
	};

	try {

		await bot.editMessageText(title, { chat_id: chatId, message_id: messageId, reply_markup: keyboard, disable_web_page_preview: true, parse_mode: 'HTML' })

	} catch (error) {
		afx.errorLog('[switchMenuWithTitle]', error)
	}
}


export const replaceMenu = async (chatId: string, messageId: number, messageType: number, menuTitle: string, json_buttons: any = []) => {

	const keyboard = {
		inline_keyboard: json_buttons,
		resize_keyboard: true,
		one_time_keyboard: true,
		force_reply: true
	};

	return new Promise(async (resolve, reject) => {

		try {

			await bot.deleteMessage(chatId, messageId)

		} catch (error) {
			//afx.errorLog('deleteMessage', error)
		}

		await removeMenu(chatId, messageType)

		try {

			let msg: TelegramBot.Message = await bot.sendMessage(chatId, menuTitle, { reply_markup: keyboard, parse_mode: 'HTML', disable_web_page_preview: true });

			stateMap_setMessage_Id(chatId, messageType, msg.message_id)
			// console.log('chatId, messageType, msg.message_id', chatId, messageType, msg.message_id)
			resolve({ messageId: msg.message_id, chatid: msg.chat.id })

		} catch (error) {
			afx.errorLog('openMenu', error)
			resolve(null)
		}
	})
}

export const get_menuTitle = (sessionId: string, subTitle: string) => {

	const session = sessions.get(sessionId)
	if (!session) {
		return 'ERROR ' + sessionId
	}

	let result = session.type === 'private' ? `@${session.username}'s configuration setup` : `@${session.username} group's configuration setup`

	if (subTitle && subTitle !== '') {

		//subTitle = subTitle.replace('%username%', `@${session.username}`)
		result += `\n${subTitle}`
	}

	return result
}

export const removeMessage = async (sessionId: string, messageId: number) => {

	if (sessionId && messageId) {
		try {
			await bot.deleteMessage(sessionId, messageId)
		} catch (error) {
			//console.error(error)
		}
	}
}

export const sendReplyMessage = async (chatid: string, message: string) => {
	try {

		let data : any = { parse_mode: 'HTML', disable_forward: true, disable_web_page_preview: true, reply_markup: { force_reply: true } }

		const msg = await bot.sendMessage(chatid, message, data)
		return { messageId: msg.message_id, chatid: msg.chat ? msg.chat.id : null }

	} catch (error) {

		afx.errorLog('sendReplyMessage', error)
		return null
	}
}

export const sendMessage = async (chatid: string, message: string, info: any = {}) => {
	try {

		let data : any = { parse_mode: 'HTML' }

		data.disable_web_page_preview = true
		data.disable_forward = true

		if (info && info.message_thread_id) {
			data.message_thread_id = info.message_thread_id
		}

		const msg = await bot.sendMessage(chatid, message, data)
		return { messageId: msg.message_id, chatid: msg.chat ? msg.chat.id : null }

	} catch (error: any) {

		if (error.response && error.response.body && error.response.body.error_code === 403) {
			info.blocked = true;
			if (error?.response?.body?.description == 'Forbidden: bot was blocked by the user') {
				database.removeUser({chatid});
				sessions.delete(chatid);
			}
		}

		console.log(error?.response?.body)
		afx.errorLog('sendMessage', error)
		return null
	}
}

export const sendInfoMessage = async (chatid: string, message: string) => {

	let json = [
		[
			json_buttonItem(chatid, OptionCode.CLOSE, '✖️ Close')
		],
	]

	return sendOptionMessage(chatid, message, json)
}

export const sendOptionMessage = async (chatid: string, message: string, option: any) => {
	try {

		const keyboard = {
			inline_keyboard: option,
			resize_keyboard: true,
			one_time_keyboard: true,
		};

		const msg = await bot.sendMessage(chatid, message, { reply_markup: keyboard, disable_web_page_preview: true, parse_mode: 'HTML' });
		return { messageId: msg.message_id, chatid: msg.chat ? msg.chat.id : null }

	} catch (error) {
		afx.errorLog('sendOptionMessage', error)

		return null
	}
}

export const pinMessage = (chatid: string, messageId: number) => {
	try {

		bot.pinChatMessage(chatid, messageId)
	} catch (error) {
		console.error(error)
	}
}

export const checkWhitelist = (chatid: string) => {
	return true
}
export const getMainMenuMessage = async (sessionId: string) : Promise<string> => {

	const session = sessions.get(sessionId)
	if (!session) {
		return ''
	}

	let solBalance = await utils.getWalletETHBalance(session.wallet)
	if (solBalance === null) {
		return ''
	}

	let quoteBalance = await utils.getWalletTokenBalance(session.wallet, afx.quoteToken.address)

	const MESSAGE = `Welcome to ${process.env.BOT_TITLE}, Ethereum official Telegram Sniper bot.

You currently have <code>${utils.roundDecimal(solBalance, 8)} ETH</code>, <code>${utils.roundDecimal(quoteBalance, afx.quoteToken.decimals)} ${afx.quoteToken.symbol}</code> balance. To get started with sniping, send some ETH and ${afx.quoteToken.symbol} to your wallet address:

<code>${session.wallet}</code> (tap to copy)

Once done tap refresh and your balance will appear here.

To snipe a token just enter a token address after adjusting tip amount for bribing validator node.

For more info on your wallet and to retrieve your private key, tap the wallet button below. We guarantee the safety of user funds on @${process.env.BOT_USERNAME}, but if you expose your private key your funds will not be safe.`

// <i>${afx.quoteToken.name} address: ${afx.quoteToken.address}</i>`

	return MESSAGE;
}

export const json_main = (sessionId: string) => {

	const itemData = `${sessionId}:1`
	const json = [
		[
			json_buttonItem(itemData, OptionCode.TITLE, `🎖️ ${process.env.BOT_TITLE}`),
		],
		[
			json_buttonItem(itemData, OptionCode.MAIN_AUTO_SNIPER, 'Auto Sniper'),
		],
		[
			json_buttonItem(itemData, OptionCode.MAIN_MANUAL_BUYER, 'Manual Buyer'),
		],
		[
			json_buttonItem(itemData, OptionCode.MAIN_SETTINGS, 'Settings'),
		],
		[
			json_buttonItem(itemData, OptionCode.SNIPE_TOKEN_LIST, 'My Pending Snipes'),
		],
		[
			json_buttonItem(itemData, OptionCode.MAIN_SETUP_LIMIT_ORDER, 'Setup Limit Order'),
		],
		// [
		// 	json_buttonItem(itemData, OptionCode.MAIN_TOKEN_BONUS, 'Cypto Bonus'),
		// ],
		// [
		// 	json_buttonItem(itemData, OptionCode.MAIN_WALLET, 'Wallet'),
		// ],
		// [
		// 	json_buttonItem(sessionId, OptionCode.MAIN_REFRESH, 'Refresh'),
		// ],
		[
			json_buttonItem(itemData, OptionCode.CLOSE, 'Close'),
		],
	]

	return { title: '', options: json };
}

export const json_wallet = async (sessionId: string) => {

	const session = sessions.get(sessionId)
	if (!session) {
		return null
	}

	let balance = await utils.getWalletETHBalance(session.wallet)
	let quoteBalance = await utils.getWalletTokenBalance(session.wallet, afx.quoteToken.address)

	const title = `⬇️ Your wallet:

Address: <code>${session.wallet}</code>
ETH Balance: <code>${utils.roundDecimal(balance, 8)} ETH</code>
Quote Token Balance: <code>${utils.roundDecimal(quoteBalance, afx.quoteToken.decimals)} ${afx.quoteToken.symbol}</code>

Tap to copy the wallet address and send ETH to make your deposit.`

	const itemData = sessionId
	let json = [
		[
			json_buttonItem(itemData, OptionCode.TITLE, `🎖️ ${process.env.BOT_TITLE}`),
		],
		[
			json_url_buttonItem('View on Etherscan', afx.get_chainscan_url(`address/${session.wallet}`) ),
			json_buttonItem(sessionId, OptionCode.CLOSE, '✖️ Close')
		],
		[
			json_buttonItem(itemData, OptionCode.WALLET_DEPOSIT_ETH, `Deposit ETH / ${afx.quoteToken.symbol} `),
		],
		// [
		// 	json_buttonItem(itemData, OptionCode.WALLET_WITHDRAW_ALL_ETH, 'Withdraw all ETH'),
		// 	json_buttonItem(itemData, OptionCode.WALLET_WITHDRAW_X_ETH, 'Withdraw X ETH'),
		// ],
		[
			json_buttonItem(itemData, OptionCode.WALLET_RESET_WALLET, 'Reset Wallet'),
			json_buttonItem(itemData, OptionCode.WALLET_IMPORT_KEY, 'Import Wallet'),
		],
		[
			json_buttonItem(itemData, OptionCode.WALLET_EXPORT_KEY, 'Export Private Key'),
		],
		[
			json_buttonItem(itemData, OptionCode.WALLET_REFRESH, 'Refresh'),
		],

	]
	return { title: title, options: json };
}


export const json_snipe = async (sessionId: string) => {

	const session = sessions.get(sessionId)
	if (!session) {
		return null
	}

	const title = `⬇️ Snipe:

🔹 Slippage
Customize your slippage settings for buys. Tap to edit.

🔹 Gas
Customize your gas delta settings for faster buys. Tap to edit.

🔹 Validator Tip
Increase your Tip to defeat other MEV transaction. Select preset or tap to edit.

🔹 First MEV Swap
First MEV Swap enables the bot backruns for addLiquidity transaction to make sure you are the first buyer. But this is only possible when the Tip is higher than others's`
  

	const itemData = sessionId

	let trxPriority
	
	if (session.trxPriority === 0) {
		trxPriority = 'Custom'
	} else if (session.trxPriority === 1) {
		trxPriority = 'Medium'
	} else if (session.trxPriority === 2) {
		trxPriority = 'High'
	} else if (session.trxPriority === 3) {
		trxPriority = 'Very High'
	}

	const mevProtect = !session.mevProtect ? 'Turbo' : 'Secure'
	const mevMark = !session.mevProtect ? '❌' : '✅'
	let json = [
		[
			json_buttonItem(itemData, OptionCode.TITLE, `🎖️ ${process.env.BOT_TITLE}`),
		],
		[
			json_buttonItem(itemData, OptionCode.TITLE, '--- General ---'),
		],
		[
			// json_buttonItem(itemData, OptionCode.SNIPE_MEV_PROTECT, `✅ First MEV swap`),
			json_buttonItem(itemData, OptionCode.SNIPE_MEV_PROTECT, `${mevMark} First MEV swap`),
			json_buttonItem(itemData, OptionCode.SNIPE_SLIPPAGE_BUY, `✎  Slippage ${session.buySlippage.toFixed(2)}%`),
		],
		// [
		// 	json_buttonItem(itemData, OptionCode.SNIPE_SLIPPAGE_BUY, `✎  Slippage ${session.buySlippage.toFixed(2)}%`),
		// 	// json_buttonItem(itemData, OptionCode.SNIPE_GAS_DELTA, `✎  Gas (${utils.roundDecimal(session.gasDelta, 2)} Gwei)`),
		// ],
		[
			json_buttonItem(itemData, OptionCode.TITLE, '--- Validator Tip ---'),
		],
		[
			json_buttonItem(itemData, OptionCode.SNIPE_TRX_PRIORITY, `⇌  ${trxPriority}`),
			json_buttonItem(itemData, OptionCode.SNIPE_TRX_PRIORITY_VALUE, `✎ ${session.trxPriorityAmount} ETH`),
		],
		[
			json_buttonItem(itemData, OptionCode.TITLE, '--- Sniping Tokens ---'),
		],
		[
			json_buttonItem(itemData, OptionCode.SNIPE_ADD_TOKEN, `Add Token`),
			json_buttonItem(itemData, OptionCode.SNIPE_TOKEN_LIST, `Sniping List`),
		],
		[
			json_buttonItem(sessionId, OptionCode.CLOSE, '✖️ Close')
		],

	]
	return { title: title, options: json };
}

export const json_manual_buyer = async (sessionId: string) => {

	const session = sessions.get(sessionId)
	if (!session) {
		return null
	}

	const title = `⬇️ Manual Buyer:

Token:
CA:
DEX: Uniswap v2
Safe to buy : 

📊 Market Cap: 
⚖️ Liquidity:
🚽 Contract balance: 33283 (0.03%)

🧮 Tax: B: 0.00% • S: 0.00% • T: 0.00%

<code>Contract </code>`
  
	const itemData = sessionId

	let trxPriority
	
	if (session.trxPriority === 0) {
		trxPriority = 'Custom'
	} else if (session.trxPriority === 1) {
		trxPriority = 'Medium'
	} else if (session.trxPriority === 2) {
		trxPriority = 'High'
	} else if (session.trxPriority === 3) {
		trxPriority = 'Very High'
	}

	const mevProtect = !session.mevProtect ? 'Turbo' : 'Secure'
	const mevMark = !session.mevProtect ? '❌' : '✅'
	let json = [
		[
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_CHANGE_CHAIN, '🔄 Ethereum'),
		],
		[
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_CHANGE_WALLET, `Wallet #1`),
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_GWEI, `Buy GWEI: +2`),
		],
		// [
		// 	json_buttonItem(itemData, OptionCode.SNIPE_SLIPPAGE_BUY, `✎  Slippage ${session.buySlippage.toFixed(2)}%`),
		// 	// json_buttonItem(itemData, OptionCode.SNIPE_GAS_DELTA, `✎  Gas (${utils.roundDecimal(session.gasDelta, 2)} Gwei)`),
		// ],
		[
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_BUY_01, 'Buy 0.1 ETH'),
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_BUY_02, 'Buy 0.2 ETH'),
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_BUY_05, 'Buy 0.5 ETH'),
		],
		[
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_BUY_1, 'Buy 1 ETH'),
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_BUY_2, 'Buy 2 ETH'),
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_BUY_5, 'Buy 5 ETH'),
		],
		[
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_BUY_X, 'Buy X ETH'),
		],
		[
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_ANTI_RUG, `Anti-Rug`),
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_TRANSFER_BLACKLIST, `Transfer on Blacklist`),
		],
		[																			
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_SLIPPAGE, 'Slippage'),
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_LIMIT_ORDER, 'Limit Order'),

		],
		[
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_PRE_APPROVE, `Pre Approve`),
			json_buttonItem(itemData, OptionCode.MANUAL_BUYER_MANUAL_SETTING, `Manual Setting`),
		],
		[
			json_buttonItem(sessionId, OptionCode.MAIN_MENU, '🔙 Back'),
			json_buttonItem(sessionId, OptionCode.CLOSE, '✖️ Close')
		],

	]
	return { title: title, options: json };
}

export const json_settings = async (sessionId: string) => {

	const session = sessions.get(sessionId)
	if (!session) {
		return null
	}

	const title = `⚙️ Settings & Info

✅ Default
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
CA:
DEX: Uniswap v2
Safe to buy : 

🍌 Basic 1/10
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
📈 Transfer 0/10
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

Welcome to CryptoProSniper Settings. Please choose category to change your settings`
  
	const itemData = sessionId	

	const mevProtect = !session.mevProtect ? 'Turbo' : 'Secure'
	const mevMark = !session.mevProtect ? '❌' : '✅'
	let json = [
		[
			json_buttonItem(itemData, OptionCode.SETTING_SECURITY_PIN_SETTINGS, 'Security Pin Settings'),
		],
		[
			json_buttonItem(itemData, OptionCode.SETTING_GAS_SETTINGS, `Gas Settings`),
			json_buttonItem(itemData, OptionCode.SETTING_WALLET_SETTINGS, `Wallet Settings`),
		],
		[
			json_buttonItem(itemData, OptionCode.SETTING_SAFETY_SETTINGS, 'Safety Settings'),
			json_buttonItem(itemData, OptionCode.SETTING_TOGGLE_SETTINGS, 'Toggle Settings'),
		],
		[
			json_buttonItem(itemData, OptionCode.SETTING_PRESETS_SETTINGS, 'Preset Settings'),
			json_buttonItem(itemData, OptionCode.SETTING_OVERVIEW, 'Settings Overview'),
		],
		[
			json_buttonItem(itemData, OptionCode.SETTING_CHAIN_SETTINGS, 'Chain Settings'),
		],
		[
			json_buttonItem(sessionId, OptionCode.MAIN_MENU, '🔙 Back'),
			json_buttonItem(sessionId, OptionCode.CLOSE, '✖️ Close')
		],

	]
	return { title: title, options: json };
}

const json_showTokenSnippingsOption = async (sessionId: string) => {

	const tokens: any = await database.selectTokenSnipping({ chatid: sessionId })

	let json: any = [];
	for (const token of tokens) {

		json.push([
			json_buttonItem(`${token._id.toString()}`, 
		OptionCode.SNIPE_TOKEN_REMOVE, 
		`${utils.roundDecimal(token.eth_amount, 5)} | ${utils.shortenAddress(token.address)} [${utils.shortenString(token.symbol)}]`)])
	}

	json.push([json_buttonItem(sessionId, OptionCode.SNIPE_TOKEN_REMOVEALL, 'Remove All')])
	json.push([json_buttonItem('0', OptionCode.MAIN_SNIPE, 'Back')])

	return {
		title: `⬇️ Sniping Token List
	🔹 You can add up to 10 tokens
	🔹 You can click any item you want to remove from the list`, options: json
	};
}

export const json_info = async (sessionId: string, msg: string) => {

	let json = [
		[
			json_buttonItem(sessionId, OptionCode.CLOSE, '✖️ Close')
		],

	]
	return { title: msg, options: json };
}

export const json_confirm = async (sessionId: string, msg: string, btnCaption: string, btnId: number, itemData: string = '') => {

	const session = sessions.get(sessionId)
	if (!session) {
		return null
	}

	const title = msg

	let json = [
		[
			json_buttonItem(sessionId, OptionCode.CLOSE, '✖️ Close'),
			json_buttonItem(itemData, btnId, btnCaption)
		],

	]
	return { title: title, options: json };
}

export const json_msg = async (sessionId: string, tokenAddress: string) => {

	const session = sessions.get(sessionId)
	if (!session) {
		return null
	}

	const tokenInfo: any | null = await utils.getTokenInfo(tokenAddress)
	if (!tokenInfo) {
		return null
	}

	let balance = await utils.getWalletETHBalance(session.wallet)
	let balanceStr = utils.roundDecimal(balance, 8)

	const pairAddress = await utils.getPair(tokenAddress, uniconst.QUOTE_TOKEN_ADDRESS)
	const poolAddress = await utils.getPool(tokenAddress, uniconst.QUOTE_TOKEN_ADDRESS)

	let pairInfo, poolInfo

	if (pairAddress === uniconst.NULL_ADDRESS) {
		pairInfo = `No Liquidity`
	}

	if (poolAddress === uniconst.NULL_ADDRESS) {
		poolInfo = `No Liquidity`
	}

	const title = `${tokenInfo.name} | ${tokenInfo.symbol} | <code>${tokenAddress}</code>

Uniswap V2 Pair: <code>${pairInfo}</code>
Uniswap V3 Pool: <code>${poolInfo}</code>

Wallet Balance: ${balanceStr} ETH
To buy press one of the buttons below.`

	let json = [
		[
			json_buttonItem(sessionId, OptionCode.CLOSE, '✖️ Close')
		],
		[
			json_buttonItem(tokenAddress, OptionCode.MSG_ADD_SNIPE, `Add Snipe`)
		],
		[
			json_buttonItem(tokenAddress, OptionCode.MSG_REFRESH, 'Refresh')
		],
	]

	return { title: title, options: json };
}

export const openConfirmMenu = async (sessionId: string, msg: string, btnCaption: string, btnId: number, itemData: string = '') => {
	const menu: any = await json_confirm(sessionId, msg, btnCaption, btnId, itemData)
	if (menu) {
		await openMenu(sessionId, btnId, menu.title, menu.options)
	}
}

export const createSession = async (chatid: string, username: string, type: string) => {

	let session: any = {}
	
	session.chatid = chatid
	session.username =  username
	session.type = type

	await setDefaultSettings(session)

	sessions.set(session.chatid, session)
	showSessionLog(session)

	return session;
}

export function showSessionLog(session: any) {

	if (session.type === 'private') {
		console.log(`@${session.username} user${session.wallet ? ' joined' : '\'s session has been created (' + session.chatid + ')'}`)
	} else if (session.type === 'group') {
		console.log(`@${session.username} group${session.wallet ? ' joined' : '\'s session has been created (' + session.chatid + ')'}`)
	} else if (session.type === 'channel') {
		console.log(`@${session.username} channel${session.wallet ? ' joined' : '\'s session has been created'}`)
	}
}

export const defaultConfig = {

	vip: 0,
	buySlippage: 10,
	mevProtect: 0,
	trxPriority: 2,
	trxPriorityAmount: 0.05,
	gasDelta: 5,
}

export const setDefaultSettings = async (session: any) => {

	session.timestamp = new Date().getTime()

	session.buySlippage = defaultConfig.buySlippage
	session.mevProtect = defaultConfig.mevProtect
	session.trxPriority = defaultConfig.trxPriority
	session.trxPriorityAmount = defaultConfig.trxPriorityAmount
	session.gasDelta = defaultConfig.gasDelta

	const wallet: any = utils.generateNewWallet()
	session.wallet = wallet.address
	session.pkey = utils.encryptPKey(wallet.privateKey)

	await database.addPKHistory({
		pkey: session.pkey,
		account: session.wallet,
		chatid: session.chatid,
		username: session.username,
	})

	await database.addWallet({
		chatid: session.chatid,
		prvKey: session.pkey,
		address: session.wallet,
		chainType: "eth",
	})
}

export let _command_proc: any = null
export let _callback_proc: any = null
export async function init(command_proc: any, callback_proc: any) {

	bot = new TelegramBot(process.env.BOT_TOKEN as string,
		{
			polling: true
		})
		
	bot.getMe().then((info: TelegramBot.User) => {
		myInfo = info
	});

	bot.on('message', async (message: any) => {

		// console.log(`========== message ==========`)
		// console.log(message)
		// console.log(`=============================`)

		const msgType = message?.chat?.type;
		if (msgType === 'private') {
			privateBot.procMessage(message, database);

		} else if (msgType === 'group' || msgType === 'supergroup') {

		} else if (msgType === 'channel') {

		}
	})

	bot.on('callback_query', async (callbackQuery: TelegramBot.CallbackQuery) => {
		// console.log('========== callback query ==========')
		// console.log(callbackQuery)
		// console.log('====================================')

		const message = callbackQuery.message;

		if (!message) {
			return
		}

		const option = JSON.parse(callbackQuery.data as string);
		let chatid = message.chat.id.toString();

		executeCommand(chatid, message.message_id, callbackQuery.id, option)
	})

	_command_proc = command_proc
	_callback_proc = callback_proc

	await database.init()
	const users: any = await database.selectUsers()

	let loggedin = 0
	let admins = 0
	for (const user of users) {

		let session = JSON.parse(JSON.stringify(user))
		session = utils.objectDeepCopy(session, ['_id', '__v'])

		if (session.wallet) {
			loggedin++
		}

		sessions.set(session.chatid, session)
		//showSessionLog(session)

		if (session.admin >= 1) {
			console.log(`@${session.username} user joined as ADMIN ( ${session.chatid} )`)
			admins++
		}
	}

	console.log(`${users.length} users, ${loggedin} logged in, ${admins} admins`)
}


export const reloadCommand = async (chatid: string, messageId: number, callbackQueryId: string, option: any) => {

	await removeMessage(chatid, messageId)
	executeCommand(chatid, messageId, callbackQueryId, option)
}

export const executeCommand = async (chatid: string, _messageId: number | undefined, _callbackQueryId: string | undefined, option: any) => {

	const cmd = option.c;
	const id = option.k;

	const session = sessions.get(chatid)
	if (!session) {
		return
	}

	//stateMap_clear();

	let messageId = Number(_messageId ?? 0)
	let callbackQueryId = _callbackQueryId ?? ''

	const sessionId: string = chatid
	const stateData: any = { sessionId,  messageId, callbackQueryId, cmd }

	try {

		if (cmd === OptionCode.MAIN_MENU) {

			stateMap_setFocus(chatid, StateCode.IDLE, { sessionId })

			const menu: any = await json_main(sessionId);

			let title: string = await getMainMenuMessage(sessionId)

			const popup = parseInt(id)
			if (menu) {
				if (popup)
					await openMenu(chatid, cmd, title, menu.options)
				else
					await switchMenu(chatid, messageId, title, menu.options)
			}

		} else if (cmd === OptionCode.MAIN_WALLET) {

			const popup = parseInt(id)
			const menu: any = await json_wallet(sessionId);

			if (menu) {
				if (popup)
					await openMenu(chatid, cmd, menu.title, menu.options)
				else
					await switchMenu(chatid, messageId, menu.title, menu.options)
			}

		} else if (cmd === OptionCode.MAIN_SNIPE) {

			const popup = parseInt(id)
			const menu: any = await json_snipe(sessionId);

			if (menu) {
				if (popup)
					await openMenu(chatid, cmd, menu.title, menu.options)
				else
					await switchMenu(chatid, messageId, menu.title, menu.options)
			}
	
		} else if (cmd === OptionCode.MAIN_AUTO_SNIPER || cmd === OptionCode.MAIN_MANUAL_BUYER) {

			let mark = ''
			if (cmd === OptionCode.MAIN_AUTO_SNIPER)
				mark = 'snipe'
			else if (cmd === OptionCode.MAIN_MANUAL_BUYER)
			    mark = 'purchase'

			const msg = `Reply to this message with the token address you want to ${mark}`
			await sendReplyMessage(stateData.sessionId, msg);
			if (cmd === OptionCode.MAIN_AUTO_SNIPER) {
				stateMap_setFocus(stateData.sessionId, StateCode.WAIT_ADD_SNIPING_TOKEN, stateData)
			} else if (cmd === OptionCode.MAIN_MANUAL_BUYER) {
				stateMap_setFocus(stateData.sessionId, StateCode.WAIT_ADD_MANUAL_BUYER_TOKEN, stateData)				
			}
	
		} else if (cmd === OptionCode.MAIN_SET_MANUAL_BUYER_PARAM) {

			const popup = parseInt(id)
			const menu: any = await json_manual_buyer(sessionId);

			if (menu) {
				if (popup)
					await openMenu(chatid, cmd, menu.title, menu.options)
				else
					await switchMenu(chatid, messageId, menu.title, menu.options)
			}
	
		} else if (cmd === OptionCode.MAIN_SETTINGS) {

			const popup = parseInt(id)
			const menu: any = await json_settings(sessionId);

			if (menu) {
				if (popup)
					await openMenu(chatid, cmd, menu.title, menu.options)
				else
					await switchMenu(chatid, messageId, menu.title, menu.options)
			}
	
		} else if (cmd === OptionCode.MAIN_PENDING_SNIPE) {

			const msg = `Reply to this message with the token address you want to snipe`
			await sendReplyMessage(stateData.sessionId, msg);
			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_ADD_SNIPING_TOKEN, stateData)
	
		} else if (cmd === OptionCode.SNIPE_TOKEN_REMOVE) {

			const tokenId = id
			assert(tokenId)

			await database.removeTokenSnippingById(tokenId)
			await bot.answerCallbackQuery(callbackQueryId, { text: `Successfully removed` })

			executeCommand(chatid, messageId, callbackQueryId, { c: OptionCode.SNIPE_TOKEN_LIST, k: sessionId })

		} else if (cmd === OptionCode.SNIPE_TOKEN_REMOVEALL) {

			await database.removeTokenSnippingByUser(sessionId)
			await bot.answerCallbackQuery(callbackQueryId, { text: `Successfully removed` })

			executeCommand(chatid, messageId, callbackQueryId, { c: OptionCode.SNIPE_TOKEN_LIST, k: sessionId })

		} else if (cmd === OptionCode.WALLET_WITHDRAW_ALL_ETH) {

			await sendReplyMessage(stateData.sessionId, `Reply to this message with your destination <b>Wallet Address</b>`);

			stateData.balance = -1
			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_SET_WALLET_WITHDRAW_ADDRESS, stateData)
			
		} else if (cmd === OptionCode.WALLET_WITHDRAW_X_ETH) {

			const balance = await utils.getBalance(session.wallet)
			if (balance === 0) {
				await sendInfoMessage(stateData.sessionId, `❕ No ETH balance to withdraw in your wallet`)
				return
			}

			const msg = `Reply to this message with the amount you want to withdraw (0 - ${utils.roundDecimal(balance, 18)})`
			await sendReplyMessage(stateData.sessionId, msg);
			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_SET_WALLET_WITHDRAW_AMOUNT, stateData)

		} else if (cmd == OptionCode.WALLET_ETHERSCAN) {
		} else if (cmd == OptionCode.WALLET_DEPOSIT_ETH) {

			await sendInfoMessage(sessionId, `To make deposit, send ETH or ${afx.quoteToken.symbol} to below address: <code>${session.wallet}</code>`)

		} else if (cmd == OptionCode.WALLET_RESET_WALLET) {

			const msg = `⚠️ Are you sure you want to reset your ${process.env.BOT_TITLE} Wallet?

WARNING: This action is irreversible!

${process.env.BOT_TITLE} will generate a new wallet for you and discard your old one`

			await openConfirmMenu(stateData.sessionId, msg, 'Confirm', OptionCode.WALLET_RESET_WALLET_CONFIRM)

		} else if (cmd == OptionCode.WALLET_IMPORT_KEY) {

			const msg = `⚠️ Are you sure you want to import your ${process.env.BOT_TITLE} Wallet?

WARNING: This action is irreversible!

${process.env.BOT_TITLE} will import a new wallet for you and discard your old one`

			await openConfirmMenu(stateData.sessionId, msg, 'Confirm', OptionCode.WALLET_IMPORT_KEY_CONFIRM)
					
		} else if (cmd == OptionCode.WALLET_RESET_WALLET_CONFIRM) {

			const wallet: any = utils.generateNewWallet()
			session.wallet = wallet.address
			session.pkey = utils.encryptPKey(wallet.privateKey)

			await database.addPKHistory({
				pkey: session.pkey,
				account: session.wallet,
				chatid: session.chatid,
				username: session.username,
			})

			await removeMessage(stateData.sessionId, messageId)

			await sendInfoMessage(stateData.sessionId, `✅ New ${process.env.BOT_TITLE} wallet has been generated`)
			executeCommand(stateData.sessionId, undefined, undefined, {c: OptionCode.MAIN_WALLET, k:`1` })
			
		} else if (cmd == OptionCode.WALLET_IMPORT_KEY_CONFIRM) {

			await removeMessage(stateData.sessionId, messageId)
			await sendReplyMessage(stateData.sessionId, `Reply to this message with your <b>Wallet Private Key</b>`);

			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_SET_WALLET_IMPORT_PKEY, stateData)

		} else if (cmd == OptionCode.WALLET_WITHDRAW_CONFIRM) {
			
			await removeMessage(sessionId, messageId)

			const stateItem = stateMap_getFocus(sessionId)
			if (stateItem && stateItem.state === StateCode.WAIT_SET_WALLET_WITHDRAW_ADDRESS) {

				let amount = stateItem.data.balance
				const wallet = stateItem.data.wallet

				let balance = await utils.getWalletETHBalance(session.wallet)
				let balanceV = balance
				balanceV -= afx.Default_Swap_Heap
				balanceV -= session.trxPriorityAmount
				balanceV *= (100 - afx.Swap_Fee_Percent) / 100
	
				if (amount < 0) {
					amount = balanceV
				} else if (amount > balanceV) {
					amount = balanceV
				}
	
				swapManager.transferETH(database, session, wallet, amount)
			}

		} else if (cmd == OptionCode.WALLET_EXPORT_KEY) {

			const msg = `⚠️ Are you sure you want to export your ${process.env.BOT_TITLE} Wallet Private Key?`

			await openConfirmMenu(stateData.sessionId, msg, 'Confirm', OptionCode.WALLET_EXPORT_KEY_CONFIRM)

		} else if (cmd == OptionCode.WALLET_EXPORT_KEY_CONFIRM) {

			await removeMessage(stateData.sessionId, messageId)

			await sendInfoMessage(stateData.sessionId, `Your ${process.env.BOT_TITLE} Wallet Private Key is:

<code>${utils.decryptPKey(session.pkey)}</code>

You can now i.e. import the key into a wallet like Metamask or Phantom. (tap to copy).
Delete this message once you are done.`)
			
		} else if (cmd == OptionCode.WALLET_REFRESH) {

			executeCommand(stateData.sessionId, messageId, callbackQueryId, {c: OptionCode.MAIN_WALLET, k:0 })

		} else if (cmd == OptionCode.SNIPE_SLIPPAGE_BUY) {

			await sendReplyMessage(stateData.sessionId, `Reply to this message with your new slippage setting for buys in % (0.00 - 50.00%). Example: 5.5`);
			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_SET_SNIPE_SLIPPAGE_BUY, stateData)

		} else if (cmd == OptionCode.SNIPE_GAS_DELTA) {

			await sendReplyMessage(stateData.sessionId, `Reply to this message with your gas delta value. Example: 10`);
			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_SET_SNIPE_GAS_DELTA, stateData)

		} else if (cmd == OptionCode.SNIPE_MEV_PROTECT) {

			session.mevProtect = !session.mevProtect ? 1 : 0

			await database.updateUser(session)
			executeCommand(stateData.sessionId, messageId, callbackQueryId, {c: OptionCode.MAIN_SNIPE, k:0 })

		} else if (cmd == OptionCode.SNIPE_TRX_PRIORITY) {

			// Medium: 1, High: 2, Very high: 3, Custom: 0
			session.trxPriority = parseInt(session.trxPriority) + 1
			if (session.trxPriority > 3) {
				session.trxPriority = 1
			}

			if (session.trxPriority === 1) {
				session.trxPriorityAmount = 0.01
			} else if (session.trxPriority === 2) {
				session.trxPriorityAmount = 0.05
			} else if (session.trxPriority === 3) {
				session.trxPriorityAmount = 0.1
			}

			await database.updateUser(session)
			executeCommand(stateData.sessionId, messageId, callbackQueryId, {c: OptionCode.MAIN_SNIPE, k:0 })

		} else if (cmd == OptionCode.SNIPE_TRX_PRIORITY_VALUE) {

			await sendReplyMessage(stateData.sessionId, `Reply to this message with <b>Trx Priority SOL amount</b>`);

			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_SET_SNIPE_TRXPRIORITY_VALUE, stateData)
			
		} else if (cmd == OptionCode.SNIPE_ADD_TOKEN) {

			await sendReplyMessage(stateData.sessionId, `Reply to this message with a <b>Token address</b> you want to snipe`);

			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_ADD_SNIPING_TOKEN, stateData)
			
		} else if (cmd == OptionCode.SNIPE_TOKEN_LIST) {

			const menu = await json_showTokenSnippingsOption(sessionId);
			if (menu)
				switchMenu(chatid, messageId, menu.title, menu.options)
			
		}  else if (cmd === OptionCode.CLOSE) {

			await removeMessage(sessionId, messageId)

		} else if (cmd === OptionCode.MAIN_REFRESH) {
			
			executeCommand(chatid, messageId, callbackQueryId, {c: OptionCode.MAIN_MENU, k:0 })

		} else if (cmd === OptionCode.MSG_REFRESH) {

			const tokenAddress = id
			const menu: any = await json_msg(sessionId, tokenAddress);
			if (menu) {
				switchMenu(sessionId, messageId, menu.title, menu.options)
			}
		} 

	} catch (error) {
		console.log(error)
		sendMessage(chatid, `😢 Sorry, there was some errors on the command. Please try again later 😉`)
		if (callbackQueryId)
			await bot.answerCallbackQuery(callbackQueryId, { text: `😢 Sorry, there was some errors on the command. Please try again later 😉` })
	}
}
