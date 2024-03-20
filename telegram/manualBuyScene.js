const { WizardScene } = require("telegraf/scenes");
const helpers = require("../utils/helpers");
const walletActions = require("../utils/walletActions");
const snipe = require("./sniper");
const Wallet = require("../models/wallet");
const { Markup } = require("telegraf");

const manualBuyScene = new WizardScene(
  "manualBuy",
  (ctx) => {
    ctx.reply("➡️Enter the token address you want to Buy:");
    return ctx.wizard.next();
  },
  async (ctx) => {
    const token = ctx.message.text;
    ctx.reply("🔃Checking address.....");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (!helpers.isValidAddress(token)) {
      ctx.reply(
        "❌ Invalid token address.\n\nPlease enter a valid token address:"
      );
      return;
    }
    if (!(await helpers.isERC20(token))) {
      ctx.reply(
        "❌ Invalid token address, the address is not a ERC20 token.\n\nPlease enter a valid token address:"
      );
      return;
    }
    ctx.reply("✅ Token address is valid.");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ctx.session.messages = [token];
    ctx.wizard.next();
    ctx.message.text = null;
    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
  },
  async (ctx) => {
    const userId = ctx.from.id;
    let user = await Wallet.findOne({ id: userId });
    let values;
    if (user && user.settings) {
      const setting = user.settings.find((s) => s.name === 'buyPresets');
      values = setting ? setting.value : defaultValues;
    } else {
      values = defaultValues;
    }
    const buttons = values.map((value) =>
      Markup.button.callback(`Buy ${value} Eth`, `preset:${value}`)
    );
    ctx.reply(
      "Select a Preset amount to Buy:",
      Markup.inlineKeyboard([
        ...pairChunk(buttons),
      ])
    );
  }
);

manualBuyScene.action(/^preset/,async (ctx)=>{
  const value = ctx.callbackQuery.data.split(':')[1]
  const wallet = await walletActions.getAllWallets(ctx.chat.id);
  //test
  snipe.sushiV2(
    ctx.chat.id,
    ctx.session.messages[0],
    "0x55ff76bffc3cdd9d5fdbbc2ece4528ecce45047e",
    value,
    wallet[0]
  );
  ctx.reply("✅ Buy setup complete, We'll buy the token and update you.");
  ctx.scene.leave();
})

function pairChunk(arr){
  // even ky leye sirf
  var temp = []
  for(var i=0;i<=arr.length/2+1;i+=2){
    temp.push(arr.slice(i,i+2))
  }
  return temp
}
module.exports = { manualBuyScene };