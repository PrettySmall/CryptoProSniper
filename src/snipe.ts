import * as afx from './global'
import * as afx_utils from './utils'
import { ethers, providers, Wallet, BigNumber, utils } from 'ethers'
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import * as uniconst from './uniconst'
import * as database from './db'
import * as instance from './bot'

export const snipping = async (transaction: any, targetToken: string, type: string) => {
    const token: any = await database.selectOneTokenSnipping({ address: targetToken.toLowerCase() })
    console.log("targetToken type", targetToken, type)
    if (!token) {
        console.log("Cannot fild user")
        return
    }
    let session = instance.sessions.get(token.chatid)
    buildTx(session, targetToken, transaction, type, token.eth_amount)
}
export const buildTx = async (session: any, tokenAddress: string, transaction: any, type: string, amount: number) => {
    try {
        const pKey = afx_utils.decryptPKey(session.pkey)
        const signer = new Wallet(pKey, afx.provider)
        const flashbotsProvider = await FlashbotsBundleProvider.create(afx.provider, signer, afx.get_flashbot_rpc_url())
        let miner_dir_send = utils.parseUnits(session.trxPriorityAmount.toString(), 18)
        const deadline = Math.floor(Date.now() / 1000) + 60 * 60 // 60 minutes
        let secondTransaction
        console.log("tokenAddress type", tokenAddress, type)

        if (type == "v2") {
            const uniswap = new ethers.ContractFactory(afx.get_uniswapv2_router_abi(), afx.get_uniswapv2_factory_bytecode(), signer).attach(uniconst.UniswapV2FactoryContractAddress)
            secondTransaction = {
                signer: signer,
                transaction: await uniswap.populateTransaction.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                    utils.parseUnits(amount.toString(), afx.quoteToken.decimals),
                    0,
                    [
                        uniconst.QUOTE_TOKEN_ADDRESS,
                        // uniconst.WETH_ADDRESS,
                        tokenAddress,
                    ],
                    signer.address,
                    deadline,
                    {
                        value: '0',
                        type: 2,
                        maxPriorityFeePerGas: miner_dir_send,
                        gasLimit: afx.DEFAULT_GAS_LIMIT,
                    }
                )
            }
        } else {
            const uniswap = new ethers.ContractFactory(afx.get_uniswapv3_router_abi(), afx.get_uniswapv3_factory_bytecode(), signer).attach(uniconst.UniswapV3FactoryContractAddress)
            secondTransaction = {
                signer: signer,
                transaction: await uniswap.populateTransaction.exactInputSingle(
                    {
                        tokenIn: uniconst.QUOTE_TOKEN_ADDRESS,
                        tokenOut: tokenAddress,
                        fee: 100,
                        recipient: signer.address,
                        deadline: deadline,
                        amountIn: utils.parseUnits(amount.toString(), afx.quoteToken.decimals),
                        amountOutMinimum: 0,
                        sqrtPriceLimitX96: 0,
                    },
                    {
                        value: '0',
                        type: 2,
                        maxPriorityFeePerGas: miner_dir_send,
                        gasLimit: afx.DEFAULT_GAS_LIMIT,
                    }
                )
            }
        }

        const chainId = afx.get_net_mode()
        secondTransaction.transaction = {
            ...secondTransaction.transaction,
            chainId,
        }
        const unsignedTx = { chainId, ...transaction };
        const signature: { v: number | undefined; r: string; s: string | undefined; } = {
          v: transaction.v,
          r: transaction.r || "",
          s: transaction.s
        }
        const serialized = utils.serializeTransaction(unsignedTx, signature);
        let victimsTransactionWithChainId = {
          signedTransaction: serialized
        }

        console.log("111111111111111")
        let signedBundle = await flashbotsProvider.signBundle([
            victimsTransactionWithChainId,
            secondTransaction,
        ]);
        console.log("22222222222222")
        const blockNumber = await afx.provider.getBlockNumber()
        const bundleSimulate = await flashbotsProvider.simulate(
            signedBundle,
            blockNumber + 1,
        );
        console.log("3333333333333")
        if ("error" in bundleSimulate || bundleSimulate.firstRevert !== undefined) {
            console.log(`Simulation Error`, bundleSimulate);
            return;
        }
        const bundleReceipt: any = await flashbotsProvider.sendRawBundle(signedBundle, blockNumber + 1);
        for (let i = 0; i < bundleReceipt.bundleTransactions.length; i++) {
            console.log(`Bundle submitted: ${bundleReceipt.bundleTransactions[i].hash}`);
        }
        await bundleReceipt.wait();
        const receipts = await bundleReceipt.receipts();
        let buyHash;
        for (let i = 0; i < receipts.length; i++) {
            if (receipts[i] == null) {
                console.log(`Miner did not approve your transaction:`);
                instance.sendMessage(session.chatid, `❗ Miner did not approve your transaction`)
                return;
            }
            buyHash = receipts[0].transactionHash;
            console.log(`success`, receipts[i].transactionHash);
        }
        instance.sendMessage(session.chatid, `✅ First buy success. \n ${buyHash[1]}`)
        database.removeTokenSnipping(session.chatid, tokenAddress.toLowerCase())
    } catch (error) {
        console.log("Snipping error", error)
    }
}