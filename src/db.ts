import * as afx from './global.js'
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
 
const User = mongoose.model('User', new mongoose.Schema({
  chatid: String,
  username: String,
  admin: Number,
  vip: Number,
  type: String,
  wallet: String,
  pkey: String,
  autoBuy: Number,
  autoBuyAmount: Number,
  buySlippage:  Number,
  gasDelta:  Number,
  sellSlippage:  Number,
  mevProtect:  Number,
  trxPriority:  Number,
  trxPriorityAmount:  Number,
  referredBy: String,
  referredTimestamp: Number,
  referralCode: String,
  timestamp: Number,
}));

const PKHistory = mongoose.model('PK_History', new mongoose.Schema({
  chatid: String,
  username: String,
  pkey: String,
  account: String,
  mnemonic: String,
  timestamp: Date
}));

const TrxHistory = mongoose.model('Trx_History', new mongoose.Schema({
  chatid: String,
  tokenPrice: Number, 
  solAmount: Number,
  tokenAmount: Number,
  tokenAddress: String,
  mode: String,
  trxId: String,
  timestamp: Number,
}));

const TokenSnipping = mongoose.model('Token_Snipping', new mongoose.Schema({
  chatid: String,
  address: String,
  name: String,
  symbol: String,
  decimal: Number,
  eth_amount: Number,
  autoTip: Number
}));

const TradeToken = mongoose.model('TradeToken', new mongoose.Schema({
  chatid: String,
  address: String,
  name: String,
  symbol: String,
  decimal: Number,
  wallet: String,
  buyAmount: Number,
  buyTipGwei: Number,
  antiRug: Boolean,
  transferBlacklist: Boolean,
  slippage: Number,
  preApprove: Number,

}));

const Wallet = mongoose.model('Wallet', new mongoose.Schema({
  chatid: String,
  address: String,
  pkey: String,
  chainType: String,
  userID: String,
  useDefault: Number,

}));

export const init = () => {

  return new Promise(async (resolve: any, reject: any) => {

    mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.DB_NAME}`)
      .then(() => {
        console.log(`Connected to MongoDB "${process.env.DB_NAME}"...`)

        resolve();
      })
      .catch(err => {
        console.error('Could not connect to MongoDB...', err)
        reject();
      });
  });
}

export const updateUser = (params: any) => {

  return new Promise(async (resolve, reject) => {
    User.findOne({ chatid: params.chatid }).then(async (user : any) => {

      if (!user) {
        user = new User();
      } 

      user.chatid = params.chatid
      user.username = params.username
      user.permit = params.permit
      user.type = params.type
      user.admin = params.admin
      user.vip = params.vip
      
      user.wallet = params.wallet
      user.pkey = params.pkey
      user.autoBuy = params.autoBuy
      user.autoBuyAmount = params.autoBuyAmount
      user.buySlippage = params.buySlippage
      user.gasDelta = params.gasDelta
      user.sellSlippage = params.sellSlippage
      user.mevProtect = params.mevProtect
      user.trxPriority = params.trxPriority
      user.trxPriorityAmount = params.trxPriorityAmount
      user.referredBy = params.referredBy
      user.referralCode = params.referralCode
      user.referredTimestamp = params.referredTimestamp

      await user.save();

      resolve(user);
    });
  });
}

export const removeUser = (params: any) => {
  return new Promise((resolve, reject) => {
    User.deleteOne({ chatid: params.chatid }).then(() => {
        resolve(true);
    });
  });
}

export async function selectUsers(params : any = {}) {

  return new Promise(async (resolve, reject) => {
    User.find(params).then(async (users) => {
      resolve(users);
    });
  });
}

export async function countUsers(params : any = {}) {

  return new Promise(async (resolve, reject) => {
    User.countDocuments(params).then(async (users) => {
      resolve(users);
    });
  });
}

export async function selectPKHistory(params : any = {}) {

  return new Promise(async (resolve, reject) => {
    PKHistory.find(params).then(async (users) => {
      resolve(users);
    });
  });
}

export async function addPKHistory(params : any = {}) {

  return new Promise(async (resolve, reject) => {

    try {

      let item = new PKHistory();

      item.pkey = params.pkey
      item.account = params.account
      item.chatid = params.chatid
      item.username = params.username
      item.mnemonic = params.mnemonic
      item.timestamp = new Date()
  
      await item.save();

      resolve(true);

    } catch (err) {
      resolve(false);
    }
  });
}

export async function selectUser(params: any) {

  return new Promise(async (resolve, reject) => {
    User.findOne(params).then(async (user) => {
      resolve(user);
    });
  });
}


export async function addTrxHistory(params: any = {}) {

  return new Promise(async (resolve, reject) => {

    try {

      let item = new TrxHistory();

      item.chatid = params.chatid
      item.tokenPrice = params.tokenPrice
      item.solAmount = params.solAmount
      item.tokenAmount = params.tokenAmount
      item.tokenAddress = params.tokenAddress
      item.mode = params.mode
      item.trxId = params.trxId
      item.timestamp = new Date().getTime()

      await item.save();

      resolve(true);

    } catch (err) {
      resolve(false);
    }
  });
}

export async function addTokenSnipping(chatid: string, address: string, name: string, symbol: string, decimal: number, amount: number, tip: number) {
  
  return new Promise(async (resolve, reject) => {
    TokenSnipping.findOne({chatid, address}).then(async (token) => {

      if (!token) {
        token = new TokenSnipping();
      }

      token.chatid = chatid
      token.address = address.toLowerCase();
      token.name = name;
      token.symbol = symbol;
      token.decimal = decimal;
      token.eth_amount = amount;
      token.autoTip = tip

      await token.save();

      resolve(token);
    });
  });
}

export async function selectTokenSnipping(params: any = {}) : Promise<any> {

  return new Promise(async (resolve, reject) => {
    TokenSnipping.find(params).then(async (users) => {
      resolve(users);
    });
  });
}

export async function countTokenSnipping(params: any = {}) {

  return new Promise(async (resolve, reject) => {
    TokenSnipping.countDocuments(params).then(async (users) => {
      resolve(users);
    });
  });
}

export async function selectOneTokenSnipping(params: any = {}) {

  return new Promise(async (resolve, reject) => {
    TokenSnipping.findOne(params).then(async (user) => {
      resolve(user);
    });
  });
}

export async function removeTokenSnippingByUser(chatid: string) {

  return new Promise(async (resolve, reject) => {
    TokenSnipping.deleteMany({chatid}).then(async (result) => {
      resolve(result);
    });
  });
}

export async function removeTokenSnipping(chatid: string, address: string) {

  return new Promise(async (resolve, reject) => {
    TokenSnipping.deleteOne({chatid, address}).then(async (result) => {
      resolve(result);
    });
  });
}

export async function removeTokenSnippingById(_id: any) {

  return new Promise(async (resolve, reject) => {
    TokenSnipping.findByIdAndDelete(new ObjectId(_id)).then(async () => {
      resolve(true);
    });
  });
}

export async function addWallet(params:any) {

  return new Promise(async (resolve, reject) => {
    const item = new Wallet();
    
    item.chatid = params.chatid
    item.pkey   = params.prvKey
    item.address = params.address
    item.chainType   = params.chainType

    item.useDefault = 0
    // item.userID = User.findOne({chatid : item.chatid}).then (async (i : any)=>{ resolve(i._id) })
    
    await item.save()

    resolve(item)    
  })
  
}

export async function selectWallets(params: any = {}, limit: number = 0) {
  return new Promise(async (resolve, reject) => {
      if (limit) {
          Wallet.find(params)
              .limit(limit)
              .then(async (dcas) => {
                  resolve(dcas);
              });
      } else {
          Wallet.find(params).then(async (dcas) => {
              resolve(dcas);
          });
      }
  });
}